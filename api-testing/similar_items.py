from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC


# Amazon search URL
# url = "https://www.amazon.in/s?k=frozen-nuts-premium-mewa-mix-almonds-cashews-kiwi-walnuts-apricots-dates-blueberry-assorted-fruits"
def find_similar_items(url):
    # Setup Chrome options
    chrome_options = Options()
    # chrome_options.add_argument('--headless')  # Run in headless mode
    # chrome_options.add_argument('--no-sandbox')
    # chrome_options.add_argument('--disable-dev-shm-usage')

    # Start the WebDriver
    driver = webdriver.Chrome(options=chrome_options)

    url = "https://www.amazon.in/s?k=" + url
    driver.get(url)

    # Wait for elements to load
    wait = WebDriverWait(driver, 10)
    wait.until(EC.presence_of_all_elements_located((By.CSS_SELECTOR, "img.s-image")))
    wait.until(EC.presence_of_all_elements_located((By.CSS_SELECTOR, "a.a-link-normal.s-line-clamp-3.s-link-style.a-text-normal")))
    wait.until(EC.presence_of_all_elements_located((By.CSS_SELECTOR, "span.a-price-whole")))
    
    # Find image elements
    images = driver.find_elements(By.CSS_SELECTOR, "img.s-image")

    # Find title and link elements
    title_links = driver.find_elements(By.CSS_SELECTOR, "a.a-link-normal.s-line-clamp-3.s-link-style.a-text-normal")


    price_tags = driver.find_elements(By.CSS_SELECTOR, "span.a-price-whole")
    # Collect results
    print(price_tags)
    results = []
    minlen = min([len(i) for i in [images, title_links, price_tags]])
    item_range = 3 if minlen > 3 else minlen
    for i in range(item_range):
        img_src = images[i].get_attribute('src')
        title_element = title_links[i]
        title_text = title_element.text
        href = title_element.get_attribute('href')
        full_url = "https://www.amazon.in" + href if href.startswith('/') else href
        price = price_tags[i].text

        results.append({
            "title": title_text,
            "url": full_url,
            "image": img_src,
            "price": price,
        })

    # Print results
    for item in results:
        print("Title:", item['title'])
        print("URL:", item['url'])
        print("Image:", item['image'])
        print("Price:" , item["price"])
        print("----")
    
    return results

    # Close the driver
    driver.quit()
