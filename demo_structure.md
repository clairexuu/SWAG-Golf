# Design Intelligence Agent for SWAG Golf

Our agent takes unstructured product ideas and outputs a structured design brief through the following steps:
1. CLI receives user input
2. Normalize "raw user input" with simple API 
    (This step is to ensure our Nano Banana receive relatively structure/clear inputs every time)
3. CLI asks user to confirm the normalized description, otherwise user can make edits
4. Perform RAG Enrichment to obtain "Normalized Input + Relevant Domain Knowledge = RAG Enriched Input"
    (Optional if Nano Banana has trained in a way that adopts RAG)
5. Send "RAG Enriched Input" into curated Nano Banana model to obtain a "design brief"
7. Finally, we deliver the final design brief to user


## How Nano Banana is curated for SWAG Golf

Nano Banana is curated by 
- training on SWAG Golf design briefs, brand guidelines, manufacturing constraints, etc. 
- reasoning guided by embedded domain heuristics such as budget over design vs. material quality (learned by the model)
- enforcing a fixed output structure of design briefs.

## Why you structured the outputs the way you did

Assuming Nano Banana was trained on a fixed output structure as we currently have in our placeholder ([design theme, target customer, color, ...]), we directly deliver that to the client. Otherwise, we could normalize the output with a simple API to follow this structure. 

The current structure [design theme, target customer, color, ...] also reflects real design workflow, from intuition to execution, and this could be improved customizing the workflow of SWAG Golf. 

## How this system could improve over time with feedback

- After normalizing user input and asking user to confirm, we could collect feedback (whether they confirm or what edit they made) and turn that to potential training data. 
- If product launches, the model could collect and learn things like which designs themes converts at SWAG Golf, what people value one over the other (heuristic), and what risk/budget/manufacturing were over/underestimated, etc.
- The output structure could improve from SWAG Golf designer feedbacks, depending on what they value more, what they prefer, what are their workflow like, everything customized. 
- We could keep a memory for this agent so that it could potentially design a series of product and provide help across teams. 

That's all I can think of so far but there's always room for improvement especially with client feedbacks