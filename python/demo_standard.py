# ModelArk video generation SDK usage example (Python)

# This is a standard Python development example that demonstrates how to use the byteplussdkarkruntime library to call the seedance 2.0 video generation model, including complete task creation and status polling logic.
# This is an example of a video editing task. The model will generate a new edited video based on the text prompt, reference image, and reference video you provide.

import os
import time
import webbrowser
from byteplussdkarkruntime import Ark

def main():
    print("------------------------------------------------------------------------------------------------------------------------------------------------------")
    print("   Seedance 2.0 video generation Python SDK example: Demonstrates a seedance 2.0 video editing task, where the model edits the input video based on the text prompt and input image to generate a new video that meets the requirements.")
    print("------------------------------------------------------------------------------------------------------------------------------------------------------")

#     1. Get API Key
#     For formal development, we recommend using environment variables to manage API keys instead of hardcoding them in the code.
    api_key = os.environ.get("ARK_API_KEY")
    if api_key:
        masked_key = f"...{api_key[-6:]}" if len(api_key) > 6 else "***"
        print(f"ARK_API_KEY ending with {masked_key} detected in local environment variables")
        choice = input("Use this environment variable directly? [Y/n] (Default: Y): ").strip().lower()
        if choice in ['n', 'no']:
            api_key = input("Please enter your API Key (press Enter to confirm): ").strip()
            if not api_key:
                print("API Key cannot be empty!")
                return
            os.environ["ARK_API_KEY"] = api_key
    else:
        print("Welcome! We need your API Key to call the model service.")
        api_key = input("Please enter your API Key (press Enter to confirm): ").strip()
        if not api_key:
            print("API Key cannot be empty!")
            return
#         Set to environment variables (only valid for the current process)
        os.environ["ARK_API_KEY"] = api_key

#     2. Initialize client
#     This step creates an Ark client instance for all subsequent API calls.
    client = Ark(api_key=api_key)

#     3. Configure video generation parameters
#     model: Model ID. Please make sure you have activated this model in the console.
#     Note: Please use the specific Model ID (e.g. dreamina-seedance-2-0-260128) or the specific Endpoint ID (ep-xxxx)
    model_id = "dreamina-seedance-2-0-260128"

#     Preset content
    user_content = "Replace the perfume in the gift box in Video 1 with the face cream in Image 1, keep the camera movement unchanged."
    reference_image_url = "https://ark-doc.tos-ap-southeast-1.bytepluses.com/doc_image/r2v_edit_pic1.jpg"
    reference_video_url = "https://ark-doc.tos-ap-southeast-1.bytepluses.com/doc_video/r2v_edit_video1.mp4"
#     reference_audio_url Input reference audio
#     reference_audio_url = "https://xxx.mp3"   

    print("\n==================================================")
    print("   Create seedance 2.0 video editing task")
    print("==================================================")
    print(f"Model ID   : {model_id}")
    print(f"Text prompt: {user_content}")
    print(f"Input reference image  : {reference_image_url}")
    print(f"Input reference video  : {reference_video_url}")
    print("--------------------------------------------------")

#     Attempt to automatically open the browser to preview assets
    print("Attempting to open the reference image and video in the browser for your preview...")
    try:
#         To prevent the browser from directly downloading mp4/jpg files, generate a simple local HTML page to display them.
        html_content = f"""
        <! DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Seedance 2.0 video editing task - asset preview</title>
            <style>
                body {{ font-family: sans-serif; margin: 40px; background: #f5f5f5; }}
                .container {{ display: flex; gap: 40px; }}
                .box {{ background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }}
                img, video {{ max-width: 400px; max-height: 400px; border: 1px solid #ddd; }}
                h3 {{ margin-top: 0; }}
                .prompt {{ background: #e3f2fd; padding: 15px; border-radius: 8px; margin-bottom: 20px; font-size: 18px; }}
            </style>
        </head>
        <body>
            <h2>Seedance 2.0 video editing task - Input asset preview</h2>
            <div class="prompt"><strong>Prompt:</strong> {user_content}</div>
            <div class="container">
                <div class="box">
                    <h3>Reference image (Replacement target)</h3>
                    <img src="{reference_image_url}" alt="Reference image">
                </div>
                <div class="box">
                    <h3>Reference video (Original video)</h3>
                    <video src="{reference_video_url}" controls autoplay loop muted></video>
                </div>
            </div>
        </body>
        </html>
        """

        preview_file_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "preview.html"))
        with open(preview_file_path, "w", encoding="utf-8") as f:
            f.write(html_content)

#         Open the local HTML using the file:// protocol
        webbrowser.open(f"file://{preview_file_path}")
    except Exception as e:
        print(f"Failed to open preview automatically: {e}, please copy the link manually and open it in the browser.")

    print("--------------------------------------------------")
    print(f"Calling the model to create a generation task...")

    try:
#         Create generation task
        create_result = client.content_generation.tasks.create(
            model=model_id,
            content=[
                {
                    "type": "text",
                    "text": user_content,
                },
                {
                    "type": "image_url",
                    "image_url": {
                        "url": reference_image_url
                    },
                    "role": "reference_image",
                },
                {
                    "type": "video_url",
                    "video_url": {
                        "url": reference_video_url
                    },
                    "role": "reference_video",
                },
#                 {
#                     "type": "audio_url",
#                     "audio_url": {
#                         "url": reference_audio_url
#                     },
#                     "role": "reference_audio",
#                 },
            ],
            generate_audio=True,
            ratio="16:9",
            duration=5,
            watermark=True,
        )

        task_id = create_result.id
        print(f"Task created successfully! Task ID: {task_id}")
        print("Polling task status. This may take a few minutes. Please wait...")

#         4. Poll and print results
        while True:
            get_result = client.content_generation.tasks.get(task_id=task_id)
            status = get_result.status

            if status == "succeeded":
                print("\nTask completed!")
                print("--------------------------------------------------")
                print("Generated video URL: You can download it to view")
                print(get_result.content.video_url)
                print("--------------------------------------------------")
                break
            elif status == "failed":
                print(f"\nTask failed: {get_result.error}")
                break
            else:
                print(f"Current status: {status}. Query again in 30 seconds...")
                time.sleep(30)

    except Exception as e:
        print(f"\nCall failed: {e}")
        print("Possible causes:")
        print("1. API Key is invalid")
        print("2. The seedance 2.0 models are not activated yet. Go to the [Model activation](https://console.byteplus.com/ark/region:ark+ap-southeast-1/openManagement) page to activate first.")
        print("3. Network connection issue")


if __name__ == "__main__":
    main()
