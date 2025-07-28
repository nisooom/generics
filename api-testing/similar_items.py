from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC


def find_similar_items(url):
    chrome_options = Options()
    chrome_options.add_argument('--headless')

    # Start the WebDriver
    driver = webdriver.Chrome(options=chrome_options)

    url = "https://www.amazon.in/s?k=" + url
    driver.get(url)

    # Wait for elements to load
    wait = WebDriverWait(driver, 10)
    xpath = '//div[contains(@class, "puis-card-container")]'
    wait.until(EC.presence_of_all_elements_located((By.XPATH, xpath)))

    images = driver.find_elements(By.XPATH, '//div[contains(@class, "puis-card-container")]//img')
    titles = driver.find_elements(By.XPATH, '//div[contains(@class, "puis-card-container")]//a//h2//span')
    prices = driver.find_elements(By.XPATH, '//div[contains(@class, "puis-card-container")]//span[@class="a-price-whole"]')
    links = driver.find_elements(By.XPATH, '//div[contains(@class, "puis-card-container")]//a')

    min_length = min(len(ls) for ls in (images, titles, prices, links))
    results = []
    for i in range(min(3, min_length)):
        img_src = images[i].get_attribute('src')
        title = titles[i].text
        price = prices[i].text
        link = links[i].get_attribute('href')

        # weird bug: some links are 'javascript:void(0)'
        if not link.startswith('https://'):
            continue

        results.append({
            "title": title,
            "url": link,
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

    driver.quit()
    return results

    # Close the driver
