# TODO

## In @prompt/

## In @style/
- allow user to initialize a style (currently manually done in backend)
    1. new images: add to style then move to @rag/reference_images
        - initialize new style with given images
        - inject new images into an existing style
    2. what if image already exist in @rag/reference_images and we want to add it to a new style or change the style it currently corresponds to? 
        - by image file name in @rag/reference_images ?
    3. what about register "Do Not Use" image references?
        - if new images, should them to move to @rag/reference_images?
        - if existing images, how to retreive from @move to @rag/reference_images? 

## In @RAG
- embedder currently supports openai/clip and google/siglip

## @init_style_and_embeddings.sh
- currently need manual initialization
- upgrade to auto initialization when user adds new style, or auto detect when there exists image/style no cached. 

## In @generate
- **Implement Approach 3: Improved In-Context Guidance in @proposal.md**

- nano banana generation 

    Currently enforced 9:16 portrait images, another choice is to follow the layout of the images in style
    try to modify SYSTEM PROMPT?

- Parallel API calls

- TEST PROMPT: 

    anime style baseball player, overlooking los angeles, with a burst of energy coming from behind him.

- QUESTION:

    With the same user prompt, GPT compiled prompt varies, which varies image generation

    - Do we prefer varied sketches in one run? if so maybe for each sketch we could use different GPT compiled prompt

    - If we keep one GPT compiled prompt for all 4 sketches, they look kind of similar. If user runs the same prompt again, they might see something very different. 

## In @control/
- make it match the style of SWAG Golf Website @https://swag.golf

- USE: 
    claude marketplace install 
    claude ~front end design install 

## In @design_doc
- **Modify Overview.md**

Let's refactor our designs docs based on some updates I made. One rule is to always remember when writing design docs is that you should write in a concise and brief way, do not include too many technical details, only include what are the functions we can use and what they do, what are the parameters, things like these. 

Always remember that you will only implement the changes. You never run the entire pipeline. I will run it manually. 