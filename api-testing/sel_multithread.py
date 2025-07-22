from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.common.exceptions import TimeoutException, NoSuchElementException
import time
import json
import re
from concurrent.futures import ThreadPoolExecutor
from model_test import get_sentiment, fake_check


def setup_driver():
    chrome_options = Options()
    chrome_options.add_argument(
        "--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36"
    )
    chrome_options.add_argument("--accept-language=en-US,en;q=0.9")

    chrome_options.add_argument("--headless")

    driver = webdriver.Chrome(options=chrome_options)
    return driver


def clean_text(text):
    text = re.sub(r"[^a-zA-Z0-9\s]", "", text)
    text = re.sub(r"\s+", " ", text.strip())
    return text.replace("READ MORE", "").strip()


def get_total_pages(driver):
    """Get total number of pages from pagination"""
    try:
        # Wait for pagination to load
        wait = WebDriverWait(driver, 5)
        page_divs = wait.until(
            EC.presence_of_all_elements_located((By.CSS_SELECTOR, "div._1G0WLw.mpIySA"))
        )

        for page_div in page_divs:
            try:
                span = page_div.find_element(By.TAG_NAME, "span")
                if "Page" in span.text and "of" in span.text:
                    return int(span.text.strip().split()[-1])
            except Exception as e:
                print(e)
                continue
        return 1
    except TimeoutException:
        print("Could not find pagination, assuming 1 page")
        return 1


def scrape_pages_range(base_url, start_page, end_page, thread_id, max_empty_pages=3):
    """Scrape a range of pages assigned to a specific thread"""
    thread_reviews = []
    driver = setup_driver()
    consecutive_empty_pages = 0

    # refreshed_already = defaultdict(bool)

    try:
        # page = start_page
        for page in range(start_page, end_page + 1):
            paged_url = f"{base_url}&page={page}"
            driver.get(paged_url)

            wait = WebDriverWait(driver, 3)

            try:
                wait.until(
                    EC.presence_of_all_elements_located((By.CSS_SELECTOR, "div.EKFha-"))
                )
            except TimeoutException:
                # print(sum(refreshed_already.values()))
                # print(f"Thread {thread_id}: No reviews found on page {page}")
                # if not refreshed_already[page]:
                #     print('Refreshing', page)
                #     driver.refresh()
                #     refreshed_already[page] = True
                #     consecutive_empty_pages = 0
                # else:
                #     page += 1
                #     consecutive_empty_pages += 1
                consecutive_empty_pages += 1

                if consecutive_empty_pages >= max_empty_pages:
                    break

                continue

            # Find all review containers
            review_containers = driver.find_elements(By.CSS_SELECTOR, "div.EKFha-")

            # Check if containers actually have content
            page_reviews_count = 0
            for container in review_containers:
                try:
                    # Review text
                    review_text = None
                    try:
                        raw_block = container.find_element(
                            By.CSS_SELECTOR, "div.ZmyHeo"
                        )
                        review_text = clean_text(raw_block.text)
                    except NoSuchElementException:
                        pass

                    # Rating
                    rating = None
                    try:
                        rating_div = container.find_element(
                            By.CSS_SELECTOR, "div.XQDdHH.Ga3i8K"
                        )
                        rating = rating_div.text.strip()
                    except NoSuchElementException:
                        pass

                    # Reviewer name and time info
                    reviewer_name = None
                    time_info = None

                    try:
                        p_tags = container.find_elements(By.CSS_SELECTOR, "p._2NsDsF")
                        for p in p_tags:
                            class_list = p.get_attribute("class").split()
                            if "AwS1CA" in class_list:
                                reviewer_name = p.text.strip()
                            elif len(class_list) == 1:
                                time_info = p.text.strip()
                    except NoSuchElementException:
                        pass

                    ldr = None
                    try:
                        ldr_tags = container.find_elements(
                            By.CSS_SELECTOR, "div._6kK6mk"
                        )
                        likes = 0
                        dislikes = 0
                        for div in ldr_tags:
                            div_list = div.get_attribute("class").split()
                            if "_6kK6mk" in div_list and "aQymJL" in div_list:
                                dislikes = div.text.strip()
                            elif "_6kK6mk" in div_list and "aQymJL" not in div_list:
                                likes = div.text.strip()
                        ldr = [likes, dislikes]
                    except NoSuchElementException:
                        pass

                    # Only add review if we have review text
                    if review_text:
                        thread_reviews.append(
                            {
                                "review": review_text,
                                "user": reviewer_name,
                                "rating": rating,
                                "time": time_info,
                                "page": page,
                                "ldr": ldr,
                                "thread_id": thread_id,
                            }
                        )
                        page_reviews_count += 1

                except Exception as e:
                    print(
                        f"Thread {thread_id}: Error parsing review on page {page}: {e}"
                    )
                    continue

            # Check if this page had any actual reviews
            if page_reviews_count == 0:
                consecutive_empty_pages += 1
                print(
                    f"Thread {thread_id}: Page {page} had no valid reviews (empty page {consecutive_empty_pages})"
                )

                # If we hit too many empty pages in a row, stop scraping
                if consecutive_empty_pages >= max_empty_pages:
                    print(
                        f"Thread {thread_id}: Found {consecutive_empty_pages} consecutive empty pages, stopping early at page {page}"
                    )
                    break
            else:
                consecutive_empty_pages = 0
                print(
                    f"Thread {thread_id}: Completed page {page}, found {page_reviews_count} reviews"
                )

    except Exception as e:
        print(f"Thread {thread_id}: Error in scraping: {e}")

    finally:
        driver.quit()

    return thread_reviews


def distribute_pages(total_pages, num_threads=4):
    if total_pages <= num_threads:
        return [(i, i) for i in range(1, total_pages + 1)]

    pages_per_thread = total_pages // num_threads
    remainder = total_pages % num_threads

    page_ranges = []
    start_page = 1

    for i in range(num_threads):
        # Add one extra page to the first 'remainder' threads
        extra_page = 1 if i < remainder else 0
        end_page = start_page + pages_per_thread - 1 + extra_page

        if start_page <= total_pages:
            page_ranges.append((start_page, min(end_page, total_pages)))
            start_page = end_page + 1

    return page_ranges


def scrape_all_reviews_threaded(base_url, num_threads=12, max_empty_pages=3):
    # First, get total pages using a single driver
    driver = setup_driver()
    try:
        driver.get(base_url)
        total_pages = get_total_pages(driver)
        print(f"Found {total_pages} pages total.")
    finally:
        driver.quit()

    if total_pages == 0:
        print("No pages found to scrape")
        return []

    page_ranges = distribute_pages(total_pages, num_threads)
    print(f"Page distribution: {page_ranges}")

    all_reviews = []

    with ThreadPoolExecutor(max_workers=num_threads) as executor:
        # Submit tasks for each thread
        future_to_thread = {}
        for i, (start_page, end_page) in enumerate(page_ranges):
            future = executor.submit(
                scrape_pages_range,
                base_url,
                start_page,
                end_page,
                i + 1,
                max_empty_pages,
            )
            future_to_thread[future] = i + 1

        # Collect results as they complete
        for future in future_to_thread:
            thread_id = future_to_thread[future]
            try:
                thread_reviews = future.result()
                all_reviews.extend(thread_reviews)
                print(
                    f"Thread {thread_id} completed successfully with {len(thread_reviews)} reviews"
                )
            except Exception as e:
                print(f"Thread {thread_id} generated an exception: {e}")

    # Sort reviews by page and remove thread metadata
    all_reviews.sort(key=lambda x: x.get("page", 0))
    for review in all_reviews:
        review.pop("page", None)
        review.pop("thread_id", None)

    print(f"Scraped {len(all_reviews)}")
    return all_reviews, len(all_reviews)


def rank_reviews_by_score(url, max_votes=10, num_threads=12):
    reviews, num_reviews = scrape_all_reviews_threaded(url, num_threads=num_threads)

    def get_total_ldr(reviews):
        likes = 0
        dislikes = 0
        for i in reviews:
            l, d = int(i["ldr"][0]), int(i["ldr"][1])
            likes += l
            dislikes += d
        return (likes - dislikes) / (likes + dislikes) if (likes + dislikes) != 0 else 0

    def get_item_ldr(review):
        likes, dislikes = int(review["ldr"][0]), int(review["ldr"][1])
        if likes + dislikes == 0:
            return 0
        return (likes - dislikes) / (likes + dislikes)

    def score_review(review, total_ldr, max_votes=50):
        likes, dislikes = int(review["ldr"][0]), int(review["ldr"][1])
        total_votes = likes + dislikes
        length_score = min(len(review["review"]) / 300, 1.0)  # long reviews rewarded
        if total_votes == 0:
            return {
                "ldr": 0,
                "eng": 0,
                "len": length_score,
            }

        review_ldr = get_item_ldr(review)

        # Component scores
        ldr_alignment = 1 - abs(review_ldr - total_ldr)  # closer is better
        engagement = min(total_votes / max_votes, 1.0)  # normalize

        # Composite score with weights
        return {
            "ldr": ldr_alignment,
            "eng": engagement,
            "len": length_score,
        }

    total_ldr = get_total_ldr(reviews)

    for review in reviews:
        review["score"] = score_review(review, total_ldr, max_votes=max_votes)

    return reviews, num_reviews


def get_reviews_formatted(url, num_threads=12):
    reviews, num = rank_reviews_by_score(
        url,
        num_threads=num_threads,
    )  # scrape_all_reviews_threaded(i, num_threads=NUM_THREADS, max_empty_pages=1)

    all_review_texts = [i["review"] for i in reviews]
    print(all_review_texts)

    all_sentiments = get_sentiment(all_review_texts)
    all_plag = fake_check(all_review_texts)

    for idx, review in enumerate(reviews):
        print(review["score"])
        review["score"]["sent"] = all_sentiments[idx]
        review["score"]["plag"] = all_plag[idx]

    grads = {
        "ldr": 0.0829,
        "eng": 0.4726,
        "len": 0.0363,
        "sent": 0.3277,
        "plag": 0.4035,
    }

    for review in reviews:
        score = review["score"]
        final_score = (
            grads["ldr"] * score.get("ldr", 1)
            + grads["eng"] * score.get("eng", 1)
            + grads["len"] * score.get("len", 1)
            + grads["sent"] * score.get("sent", 1)
            + grads["plag"] * score.get("plag", 1)
        )
        review["final_score"] = min(final_score, 1.0)

    return reviews, num


if __name__ == "__main__":
    review_page_url = [
        # "https://www.flipkart.com/tripr-solid-men-mandarin-collar-dark-green-black-t-shirt/product-reviews/itm6c3c93e8e1be1?pid=TSHGZ29HZ45PKUFA&lid=LSTTSHGZ29HZ45PKUFAT38BP8&marketplace=FLIPKART",
        # "https://www.flipkart.com/realme-p3-5g-space-silver-128-gb/product-reviews/itm69060f73d27e8?pid=MOBHAYN5SGFFG88U&lid=LSTMOBHAYN5SGFFG88UIOKMGU&marketplace=FLIPKART",
        # "https://www.flipkart.com/motorola-g45-5g-viva-magenta-128-gb/product-reviews/itmab7651d40eb72?pid=MOBH3YKQMPVFBUB5&lid=LSTMOBH3YKQMPVFBUB5BQUMDM&marketplace=FLIPKART",
        # "https://www.flipkart.com/samsung-galaxy-f06-5g-bahama-blue-128-gb/product-reviews/itm58189fada62cb?pid=MOBH9AS47XHFRMJY&lid=LSTMOBH9AS47XHFRMJYWI8CRI&marketplace=FLIPKART",
        "https://www.flipkart.com/frozen-nuts-premium-mewa-mix-almonds-cashews-kiwi-walnuts-apricots-dates-blueberry-assorted-fruits/product-reviews/itmb599a803d76cb?pid=NDFH9GZZKGEQV8YK&lid=LSTNDFH9GZZKGEQV8YK24UYEG&marketplace=FLIPKART",
        # "https://www.flipkart.com/vellosta-men-self-design-casual-black-shirt/product-reviews/itm1d0ab280b3fc9?pid=SHTHCFXAJ5H4EHNG&lid=LSTSHTHCFXAJ5H4EHNGO67UAK&marketplace=FLIPKART",
    ]

    NUM_THREADS = 6

    cnt = 0
    total_reviews = 0
    m_start = time.time()
    for i in review_page_url:
        print(f"Scraping {i}")
        start_time = time.time()
        reviews = get_reviews_formatted(
            i,
            num_threads=NUM_THREADS,
        )  # scrape_all_reviews_threaded(i, num_threads=NUM_THREADS, max_empty_pages=1)

        all_review_texts = [i["review"] for i in reviews]
        print(all_review_texts)

        all_sentiments = get_sentiment(all_review_texts)
        all_plag = fake_check(all_review_texts)

        for idx, review in enumerate(reviews):
            print(review["score"])
            review["score"]["sent"] = all_sentiments[idx]
            review["score"]["plag"] = all_plag[idx]

        end_time = time.time()

        file_name = f"flipkart_detailed_reviews{cnt}.json"
        cnt += 1

        # Save to JSON file
        with open(file_name, "w", encoding="utf-8") as f:
            json.dump(reviews, f, ensure_ascii=False, indent=4)
        total_reviews += len(reviews)
        print(
            f"\nScraped {len(reviews)} reviews total in {end_time - start_time:.2f} seconds."
        )
    m_end = time.time()

    print(f"Scraped {total_reviews} and {cnt} Pages in {m_end - m_start:.2f}s.")
