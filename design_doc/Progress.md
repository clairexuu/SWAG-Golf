# TODO

In @prompt/
    **Remove prompt_spec and keep only refined intent?**
        where are the other fields of prompt_spec used in the pipeline?

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

In @initialize/
    - currently need manual initialization
    - upgrade to auto initialization when user adds new style from frontend, or auto detect when there exists image/style no cached. 

In @generate
    **Go over the pipeline**
    **Run test_pipeline.py with new images**

In @control/    (frontend)
    **Update frontend style selection to reflect the "default" style**
    make it match the style of SWAG Golf Website @https://swag.golf
    connect current pipeline to frontend

In @design_doc
    **Modify Get_Started.md (to run frontend, rename to Run_Dev)**
    **Modify Overview.md**
    Let's refactor our designs docs based on some updates I made. One rule is to always remember when writing design docs is that you should write in a concise and brief way, do not include too many technical details, only include what are the functions we can use and what they do, what are the parameters, things like these. 

    Always remember that you will only implement the changes. You never run the entire pipeline. I will run it manually. 