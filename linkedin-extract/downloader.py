import argparse
import os
import re
import time

from selenium import webdriver
from selenium.webdriver.chrome.service import Service

from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

from webdriver_manager.chrome import ChromeDriverManager


# =====================================================
# CONFIG
# =====================================================

PROFILE_PATH = "/Users/bhuvanps/LinkedInAutomationChrome"
PROFILE_NAME = "Default"

DOWNLOAD_FOLDER = os.path.abspath("downloads")


# =====================================================
# HELPERS
# =====================================================

def get_profile_slug(url):

    match = re.search(
        r"/in/([^/?]+)",
        url
    )

    if match:
        return match.group(1)

    return "linkedin-profile"



def create_driver():

    os.makedirs(
        DOWNLOAD_FOLDER,
        exist_ok=True
    )


    options = webdriver.ChromeOptions()

    options.add_argument(
        f"--user-data-dir={PROFILE_PATH}"
    )

    options.add_argument(
        f"--profile-directory={PROFILE_NAME}"
    )

    options.add_argument(
        "--start-maximized"
    )

    options.add_argument(
        "--no-first-run"
    )

    options.add_argument(
        "--no-default-browser-check"
    )


    prefs = {
        "download.default_directory": DOWNLOAD_FOLDER,
        "download.prompt_for_download": False,
        "download.directory_upgrade": True,
        "plugins.always_open_pdf_externally": True
    }


    options.add_experimental_option(
        "prefs",
        prefs
    )


    return webdriver.Chrome(
        service=Service(
            ChromeDriverManager().install()
        ),
        options=options
    )



def wait_for_profile(driver):

    print(
        "Waiting for profile..."
    )


    WebDriverWait(
        driver,
        30
    ).until(
        EC.presence_of_element_located(
            (
                By.CSS_SELECTOR,
                "main"
            )
        )
    )


    time.sleep(2)


    print(
        "Profile loaded"
    )



def clear_previous_pdf():

    pdf = os.path.join(
        DOWNLOAD_FOLDER,
        "profile.pdf"
    )


    if os.path.exists(pdf):

        os.remove(pdf)



def click_save_pdf(driver):

    wait = WebDriverWait(
        driver,
        20
    )


    print(
        "Finding three dots menu..."
    )


    driver.execute_script(
        "window.scrollTo(0,0);"
    )


    time.sleep(1)


    buttons = driver.find_elements(
        By.TAG_NAME,
        "button"
    )


    more_button = None


    for button in buttons:

        try:

            aria = button.get_attribute(
                "aria-label"
            )

            html = button.get_attribute(
                "innerHTML"
            )


            if (
                aria == "More"
                or
                "overflow-web-ios-small" in html
            ):

                if button.is_displayed():

                    more_button = button
                    break

        except Exception:
            pass



    if not more_button:

        raise Exception(
            "More button not found"
        )


    print(
        "More button found"
    )


    driver.execute_script(
        "arguments[0].click();",
        more_button
    )


    time.sleep(1.5)


    print(
        "Finding Save to PDF..."
    )


    save_pdf = wait.until(
        EC.presence_of_element_located(
            (
                By.XPATH,
                "//p[normalize-space()='Save to PDF']"
            )
        )
    )


    print(
        "Save to PDF found"
    )


    driver.execute_script(
        """
        arguments[0]
        .closest('div')
        .click();
        """,
        save_pdf
    )


    print(
        "Save to PDF clicked"
    )



def wait_for_download(timeout=60):

    print(
        "Waiting for PDF download..."
    )


    pdf_path = os.path.join(
        DOWNLOAD_FOLDER,
        "profile.pdf"
    )


    start = time.time()


    while time.time() - start < timeout:

        if os.path.exists(pdf_path):

            if not os.path.exists(
                pdf_path + ".crdownload"
            ):

                return pdf_path


        time.sleep(1)


    return None



def rename_pdf(pdf_path, slug):

    new_path = os.path.join(
        DOWNLOAD_FOLDER,
        f"{slug}.pdf"
    )


    if os.path.exists(new_path):

        os.remove(
            new_path
        )


    os.rename(
        pdf_path,
        new_path
    )


    return new_path



# =====================================================
# MAIN
# =====================================================

def main():

    parser = argparse.ArgumentParser(
        description="LinkedIn Profile PDF Downloader"
    )


    parser.add_argument(
        "url",
        help="LinkedIn profile URL"
    )


    args = parser.parse_args()


    linkedin_url = args.url


    slug = get_profile_slug(
        linkedin_url
    )


    driver = create_driver()


    try:

        print(
            "Opening LinkedIn profile..."
        )


        driver.get(
            linkedin_url
        )


        time.sleep(2)


        current_url = driver.current_url.lower()


        if (
            "login" in current_url
            or "authwall" in current_url
        ):

            raise Exception(
                "LinkedIn login required"
            )


        wait_for_profile(
            driver
        )


        clear_previous_pdf()


        click_save_pdf(
            driver
        )


        downloaded = wait_for_download()


        if not downloaded:

            raise Exception(
                "PDF download failed"
            )


        final_file = rename_pdf(
            downloaded,
            slug
        )


        print(
            "\nCompleted:"
        )

        print(
            final_file
        )


    finally:

        driver.quit()



if __name__ == "__main__":

    main()