# TODO

## In @prompt/

## In @style/
- No "Do Not Use" image references yet

## In @RAG

## In @generate
**- Do we keep all generated image on disk or do we want to clear them once a while?**
- Implement Approach 3: Improved In-Context Guidance in @proposal.md

- nano banana generation 
    - Currently enforced 9:16 portrait images, another choice is to follow the layout of the images in style

- Parallel API calls

- TEST PROMPT: 

    - anime style baseball player, overlooking los angeles, with a burst of energy coming from behind him.

    - Muscular / Athletic baseball player with baseball bat in his right hand, resting behind his neck on his shoulder. HIs left hand is tossing up a baseball casually like he’s ready to play ball. Have a anime style to it - and have smoke coming from his eyes. 

## In @feedback
**- TEST feedback_summary**

## In @control/
- USE /plugin install ui-designer@daymade-claude-code-skills
- add a feature to **interrupt generaton**
- Need **error log** on the frontend when anything fails, such as python connection error
    instead of falling to placeholder, we should show what's wrong in the error log and maybe suggest a fix

## In @design_doc

Let's refactor our designs docs based on some updates I made. One rule is to always remember when writing design docs is that you should write in a concise and brief way, do not include too many technical details, only include what are the functions we can use and what they do, what are the parameters, things like these. 

Reflect this new feature in @design_doc/

## Deliverable
**- Should be a downloaded web app through electron?**