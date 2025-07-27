For this session:
rating is still not working.

1) Set up email triggering when form is submitted. 

2) Be more clear with the difference of self hosted tools and not... 
That means: Create an additional filter saying Jongu Tools vs Community Tools. Change the title from Community Wellness Tool Garden to Jongu Tool Garden. THen, for every form submission automate it by default to be a community tool. IN the admin panel, give me the option to change it to a Jongu tool. Give me instructions on what to change in Supabase to Allow for that. I think null values = community, so that I can simply create a new column with empty values and when I click make it a Jongu tool in the admin panel, we ovewrite with "Jongu", which will feed the filter. But please think if this solution is the most effective one before implementing. 

Change description:
from: Discover wellness tools organized by DBT skills: Mindfulness practices, Distress Tolerance techniques, Emotion Regulation guides, and Interpersonal Effectiveness builders. Journaling apps, creativity prompts, relationship boosters, and therapeutic exercises. Created by real people for real people.

to (improve it): Discover wellness tools. Journaling apps, creativity prompts, relationship boosters, and therapeutic exercises. Created by real people for real people.
For tools published by us (filter by Jongu Tools), you can always count that 1) AI use will be optional and the tool will be valuabel even without AI, 2) your data will not be stored by us unless you want to save it. 
To partner with us to create Jongu Tools, use Collaboration Form. If you want to submit a tool from anywhere in the internet, Use the "Share a Tool" button.
[buttons]

3) Require authentication for AI help to be enabled. (Later we will include a credit system in which we will collect payments with Stripe and Charge based on a credit system for AI calls with 2x cost for me to give me some margin - work on a plan to do that later and overwrite the content of claude copy.md with your plan so I will start tomorrow). 

4) Create a place where people can read other peoples reviews. Maybe when they click the rating there is a pop up with other people's reviews? 

5) Include Supabase files in gitignore., Move any supabase files that were important for migration but not for other people using this to the migration folder as well.