# Current Version

User Input --> GPT compiler --> RAG --> Image Generation


# TODO

Modify all design doc, prompt, and schema to keep it minimal for now, add details later based on the data/need/PRD

In @prompt/

In @style/
    - allow user to initialize a style (currently manually done in backend)
        1. new images: add to style then move to @rag/reference_images
            - initialize new style with given images
            - inject new images into an existing style
        2. what if image already exist in @rag/reference_images and we want to add it to a new style or change the style it currently corresponds to? 
            - by image file name in @rag/reference_images ?
        3. what about register "Do Not Use" image references?
            - if new images, should them to move to @rag/reference_images?
            - if existing images, how to retreive from @move to @rag/reference_images? 

In @RAG
    **need a instruction md how to to initialize/index rag with new images**

In @generate

In @control/    (frontend)
    **Update frontend style selection to reflect the "default" style**
    make it match the style of SWAG Golf Website @https://swag.golf
    connect current pipeline to fronttend

In @design_doc
    Let's refactor our designs docs based on some updates I made. One rule is to always remember when writing design docs is that you should write in a concise and brief way, do not include too many technical details, only include what are the functions we can use and what they do, what are the parameters, things like these. 

    Always remember that you will only implement the changes. You never run the entire pipeline. I will run it manually. 

# Issues

Waiting for:
    Style Library
    RAG Image DataBase 