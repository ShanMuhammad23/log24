/**
 * Google Apps Script: creates the full survey form for the research project
 * "Skill Gap, Career Guidance and Youth Unemployment"
 *
 * HOW TO USE:
 * 1. Go to https://script.google.com  (login with your Google account)
 * 2. Click "New project", delete the sample code, paste this entire file
 * 3. Click "Run" (play button) on createSurveyForm
 * 4. First run asks for permissions -> Review permissions -> Allow
 * 5. Open "Executions"/logs (Ctrl+Enter / View > Logs) to get the form links
 *    - editUrl = link to edit the form
 *    - responderUrl = link to share with students
 */

function createSurveyForm() {
  var form = FormApp.create('Skill Gap, Career Guidance and Youth Unemployment - Student Survey');

  form.setDescription(
    'This survey is for a university research project on how the skill gap and lack of career guidance affect youth unemployment, and whether AI-based career tools can help. ' +
    'It takes about 5 minutes. All responses are anonymous and will be used only for academic research. Thank you for participating!'
  );
  form.setCollectEmail(false);
  form.setLimitOneResponsePerUser(false);

  /* ---------- SECTION 1: Demographics ---------- */
  form.addSectionHeaderItem().setTitle('Section 1: About You');

  form.addMultipleChoiceItem()
    .setTitle('1. What is your age group?')
    .setChoiceValues(['18-20', '21-23', '24-25'])
    .setRequired(true);

  form.addMultipleChoiceItem()
    .setTitle('2. Gender')
    .setChoiceValues(['Male', 'Female', 'Prefer not to say'])
    .setRequired(true);

  form.addMultipleChoiceItem()
    .setTitle('3. What is your current status?')
    .setChoiceValues(['Undergraduate student', 'Recent graduate (within last 2 years)', 'Other'])
    .setRequired(true);

  form.addMultipleChoiceItem()
    .setTitle('4. What is your field of study?')
    .setChoiceValues([
      'Computer Science / IT',
      'Business / Management',
      'Engineering',
      'Social Sciences',
      'Arts / Humanities',
      'Medical / Health Sciences',
      'Natural Sciences',
      'Other'
    ])
    .setRequired(true);

  form.addMultipleChoiceItem()
    .setTitle('5. What is your current year of study? (If graduate, select your final year)')
    .setChoiceValues(['1st year', '2nd year', '3rd year', '4th year', 'Already graduated'])
    .setRequired(true);

  /* ---------- SECTION 2: Skills and Skill Gap ---------- */
  form.addSectionHeaderItem().setTitle('Section 2: Your Skills');

  form.addScaleItem()
    .setTitle('6. How confident are you in your practical / technical skills?')
    .setBounds(1, 5)
    .setLabels('Not confident', 'Very confident')
    .setRequired(true);

  form.addScaleItem()
    .setTitle('7. How well do the skills taught in your degree match what employers are looking for?')
    .setBounds(1, 5)
    .setLabels('Not at all', 'Very well')
    .setRequired(true);

  form.addCheckboxItem()
    .setTitle('8. Which of these skills do you feel you are lacking? (Select all that apply)')
    .setChoiceValues([
      'Communication skills',
      'Technical / software skills',
      'Teamwork',
      'Problem solving',
      'Time management',
      'CV / resume writing',
      'Interview skills',
      'None - I feel well prepared'
    ])
    .setRequired(true);

  form.addParagraphTextItem()
    .setTitle('9. Which skill do you think employers want most that your education did NOT teach you? (Open answer)')
    .setRequired(false);

  /* ---------- SECTION 3: Career Guidance ---------- */
  form.addSectionHeaderItem().setTitle('Section 3: Career Guidance');

  form.addMultipleChoiceItem()
    .setTitle('10. Have you ever received any career guidance?')
    .setChoiceValues([
      'Yes, at school',
      'Yes, at university',
      'Yes, online / through an app',
      'Yes, from family or friends only',
      'No, never'
    ])
    .setRequired(true);

  form.addMultipleChoiceItem()
    .setTitle('11. How often have you talked with a career adviser or counsellor?')
    .setChoiceValues(['Never', 'Once', 'A few times (2-5)', 'Regularly (more than 5 times)'])
    .setRequired(true);

  form.addScaleItem()
    .setTitle('12. If you received career guidance, how helpful was it? (Skip-level: choose 1 if never received)')
    .setBounds(1, 5)
    .setLabels('Not helpful / never received', 'Very helpful')
    .setRequired(true);

  form.addMultipleChoiceItem()
    .setTitle('13. How did you mainly choose your field of study?')
    .setChoiceValues([
      'My own interest',
      'Parents / family advice',
      'Friends / classmates',
      'Job market demand',
      'My marks / grades decided it',
      'A career adviser suggested it',
      'Other'
    ])
    .setRequired(true);

  form.addParagraphTextItem()
    .setTitle('14. What kind of career guidance do you wish you had received? (Open answer)')
    .setRequired(false);

  /* ---------- SECTION 4: AI-Based Career Tools ---------- */
  form.addSectionHeaderItem().setTitle('Section 4: AI-Based Career Tools');

  form.addMultipleChoiceItem()
    .setTitle('15. Have you ever used an AI-based tool for career help? (e.g. ChatGPT, career quiz apps, LinkedIn suggestions, CV builders)')
    .setChoiceValues(['Yes, regularly', 'Yes, once or twice', 'No, never'])
    .setRequired(true);

  form.addCheckboxItem()
    .setTitle('16. Which of these have you used for career or job help? (Select all that apply)')
    .setChoiceValues([
      'ChatGPT or similar chatbots',
      'LinkedIn (job suggestions / profile tips)',
      'Online career quiz or personality test apps',
      'AI CV / resume builders',
      'Job matching websites or apps',
      'None of these'
    ])
    .setRequired(true);

  form.addScaleItem()
    .setTitle('17. How useful did you find AI-based tools for your career planning? (Choose 1 if you never used one)')
    .setBounds(1, 5)
    .setLabels('Not useful / never used', 'Very useful')
    .setRequired(true);

  form.addParagraphTextItem()
    .setTitle('18. In what way did AI tools help, or not help, your career planning? (Open answer)')
    .setRequired(false);

  /* ---------- SECTION 5: Job Search and Unemployment ---------- */
  form.addSectionHeaderItem().setTitle('Section 5: Job Search');

  form.addMultipleChoiceItem()
    .setTitle('19. How long have you been actively searching for a job?')
    .setChoiceValues(['I am not searching yet', 'Less than 3 months', '3-6 months', '6-12 months', 'More than 1 year'])
    .setRequired(true);

  form.addMultipleChoiceItem()
    .setTitle('20. Roughly how many jobs have you applied to so far?')
    .setChoiceValues(['0', '1-5', '6-15', '16-30', 'More than 30'])
    .setRequired(true);

  form.addMultipleChoiceItem()
    .setTitle('21. How many job interviews have you been called for?')
    .setChoiceValues(['0', '1-3', '4-7', '8 or more'])
    .setRequired(true);

  form.addMultipleChoiceItem()
    .setTitle('22. What is the BIGGEST difficulty you face in your job search?')
    .setChoiceValues([
      'Lack of required skills',
      'Lack of career guidance / direction',
      'Very few job openings',
      'Employers want experience I do not have',
      'Too much competition',
      'No contacts / networking',
      'Other'
    ])
    .setRequired(true);

  form.addMultipleChoiceItem()
    .setTitle('23. In your opinion, what is the MAIN cause of youth unemployment?')
    .setChoiceValues([
      'Skill gap (education does not match jobs)',
      'Lack of career guidance',
      'Not enough jobs available',
      'Bad economic conditions',
      'Other'
    ])
    .setRequired(true);

  form.addParagraphTextItem()
    .setTitle('24. In your opinion, what ONE change would most help students find jobs? (Open answer)')
    .setRequired(false);

  Logger.log('===================================');
  Logger.log('Form created successfully!');
  Logger.log('Edit URL (for you): ' + form.getEditUrl());
  Logger.log('Share URL (for students): ' + form.getPublishedUrl());
  Logger.log('===================================');
}
