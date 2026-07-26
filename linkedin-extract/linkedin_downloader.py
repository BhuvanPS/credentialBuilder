import os
import re
import time
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager

PROFILE_PATH = "/Users/bhuvanps/LinkedInAutomationChrome"
PROFILE_NAME = "Default"

DOWNLOAD_FOLDER = os.path.abspath("downloads")

def get_profile_slug(url):
    match = re.search(r"/in/([^/?]+)", url)
    return match.group(1) if match else "profile"

def create_driver():
    os.makedirs(DOWNLOAD_FOLDER, exist_ok=True)

    options = webdriver.ChromeOptions()

    options.add_argument(f"--user-data-dir={PROFILE_PATH}")

    options.add_argument(f"--profile-directory={PROFILE_NAME}")

    options.add_argument("--headless=new")

    options.add_argument("--no-sandbox")

    prefs = {
        "download.default_directory": DOWNLOAD_FOLDER,
        "download.prompt_for_download": False,
        "plugins.always_open_pdf_externally": True,
    }

    options.add_experimental_option("prefs", prefs)

    return webdriver.Chrome(
        service=Service(ChromeDriverManager().install()), options=options
    )


def click_save_pdf(driver):

    wait = WebDriverWait(driver, 30)

    buttons = driver.find_elements(By.TAG_NAME, "button")

    more_button = None

    for button in buttons:

        html = button.get_attribute("innerHTML")

        aria = button.get_attribute("aria-label")

        if aria == "More" or "overflow-web-ios-small" in html:

            if button.is_displayed():

                more_button = button
                break

    if not more_button:

        raise Exception("More button not found")

    driver.execute_script("arguments[0].click();", more_button)

    time.sleep(1)

    save_pdf = wait.until(
        EC.presence_of_element_located(
            (By.XPATH, "//p[normalize-space()='Save to PDF']")
        )
    )

    driver.execute_script(
        """
        arguments[0]
        .closest('div')
        .click();
        """,
        save_pdf,
    )


def wait_for_pdf(timeout=60):

    pdf = os.path.join(DOWNLOAD_FOLDER, "profile.pdf")

    start = time.time()

    while time.time() - start < timeout:

        if os.path.exists(pdf):

            if not os.path.exists(pdf + ".crdownload"):
                return pdf

        time.sleep(1)
    return None

def download_profile_pdf(url):

    slug = get_profile_slug(url)

    driver = create_driver()

    try:

        old_pdf = os.path.join(DOWNLOAD_FOLDER, "profile.pdf")

        if os.path.exists(old_pdf):
            os.remove(old_pdf)

        driver.get(url)

        time.sleep(2)

        WebDriverWait(driver, 30).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, "main"))
        )

        click_save_pdf(driver)

        pdf = wait_for_pdf()

        if not pdf:

            raise Exception("Download failed")

        final_path = os.path.join(DOWNLOAD_FOLDER, f"{slug}.pdf")

        os.rename(pdf, final_path)

        return final_path

    finally:

        driver.quit()
