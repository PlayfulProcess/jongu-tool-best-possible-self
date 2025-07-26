Commit.
The problems I am seeing:
1) THe entries in the sidebar are showing the beggining of the txt that does not automatically update when I update the entry, which might confuse the user. THe data is being updated in Supabase, but they just render when refreshing the page. 
2) Nothing happens when people type "new entry, so they think nothing might actually be working, when it has. 
3)New Entries are not deleting the chat history. WHen I click in past entries, I cannot retrieve my chat history. 
4) User cannot go back home from the app website.

Solutions: think about it before implementing and let me know if you think you have a better one:
1) LEave a note saying that sometimes it takes a while for the new entries to be updated in the sidebar on the top of the side bar. Also, when people click update, include a pop up that also lets them know  that it might take a while for the sidebar to refresh if they dont refresh the page and that is ok. If they refresh the page, they will lose unsaved data. Try to explain this in as few words as possible to still keep the message clear. 
2) Create a popup when people type in "new entry" explain that unsaved data will be lost and ask for the user to click ok before continuing. 
3) For now, keep trat chats in the same way as you are treating the jorunaling itself in the wrokflows of save and retrieve. That is. When pressing new entry, the chat should disappear. When I click in a past history, it should retrieve both the journaling prompt and the chat history for the user to continue to talk to AI.
4) Create a home button in the app. 