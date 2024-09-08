import requests
from bs4 import BeautifulSoup
import os

# List of player names
players = [
    "M Muralitharan", "Wasim Akram", "Waqar Younis", "WPUJC Vaas", "Shahid Afridi", 
    "SM Pollock", "GD McGrath", "B Lee", "SL Malinga", "A Kumble", 
    "ST Jayasuriya", "J Srinath", "DL Vettori", "SK Warne", "AB Agarkar", 
    "Saqlain Mushtaq", "Z Khan", "JH Kallis", "AA Donald", "Abdul Razzaq", 
    "JM Anderson", "Harbhajan Singh", "Mashrafe Mortaza", "M Ntini", 
    "Shakib Al Hasan", "Kapil Dev", "Shoaib Akhtar", "KD Mills", "MG Johnson", 
    "HH Streak", "D Gough", "CA Walsh", "CEL Ambrose", "Abdur Razzak", 
    "CZ Harris", "CJ McDermott", "CL Cairns", "DJ Bravo", "KMDN Kulasekara", 
    "BKV Prasad", "DW Steyn", "SR Waugh", "CL Hooper", "L Klusener", 
    "M Morkel", "CRD Fernando", "TG Southee", "Saeed Ajmal", "Aaqib Javed", 
    "Imran Khan"
]


# Function to search and download player images
def download_player_images(player_name):
    search_url = f"https://www.google.com/search?q={player_name.replace(' ', '+')}+cricketer&tbm=isch"
    headers = {"User-Agent": "Mozilla/5.0"}
    
    # Get the page content
    response = requests.get(search_url, headers=headers)
    soup = BeautifulSoup(response.text, 'html.parser')
    
    # Find the first relevant image
    img_tags = soup.find_all("img")
    
    for img_tag in img_tags:
        if 'src' in img_tag.attrs:
            img_url = img_tag['src']
            # Ensure the URL is absolute and it's not a Google logo or any other unrelated image
            if img_url.startswith('http') and "google" not in img_url and "logo" not in img_url:
                download_image(img_url, player_name)
                break  # Download only the first relevant image
        else:
            print(f"No image found for {player_name}")

# Function to download image from a URL
def download_image(img_url, player_name):
    try:
        response = requests.get(img_url)
        if response.status_code == 200:
            # Save the image in a folder
            if not os.path.exists('bowler_images'):
                os.makedirs('bowler_images')
            
            image_path = f"bowler_images/{player_name.replace(' ', '_')}.jpg"
            with open(image_path, 'wb') as img_file:
                img_file.write(response.content)
            print(f"Downloaded: {player_name}")
        else:
            print(f"Failed to download image for {player_name} (Status code: {response.status_code})")
    except Exception as e:
        print(f"Error downloading image for {player_name}: {e}")

# Loop through each player and download the image
for player in players:
    download_player_images(player)
