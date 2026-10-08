/* DRAFT ai900 Decision Lab seed scenarios (AI-901 rebuild, 2026-10-08) · answers NOT yet founder-verified. Review before ship. */
window.DECISION_LAB_SEED_AI900 = [
  {
    id: 'ai900-dl-rai-1', cert: 'ai900', objective: '1.1', topic: 'Responsible AI principles',
    title: 'Name the principle a loan model breaks', estMinutes: 3,
    scenario: 'A bank\'s loan model approves applicants with near-identical finances at <mark>very different rates depending on their postcode</mark>. Which Responsible AI principle is most at risk?',
    pair: 'Fairness vs Inclusiveness',
    family: 'Responsible AI principles',
    steps: [
      { id: 's1', type: 'analyze', points: 1,
        prompt: 'Select the principle.',
        explanation: 'The tell is comparable applicants getting different outcomes by group. Equal treatment of similar people is fairness.',
        payload: {
          multi: false,
          lines: [
            { id: 'l1', text: 'Fairness' },
            { id: 'l2', text: 'Transparency', why: 'Transparency is about explaining how the model reaches decisions. The problem here is the unequal outcome itself.' },
            { id: 'l3', text: 'Reliability and safety', why: 'Reliability and safety is about consistent, safe behaviour under expected and unexpected conditions, not equal treatment.' },
            { id: 'l4', text: 'Inclusiveness', why: 'Inclusiveness is about designing for people of all abilities and backgrounds to use the system.' }
          ]
        },
        answer: { selected: ['l1'] } }
    ]
  },

  {
    id: 'ai900-dl-rai-2', cert: 'ai900', objective: '1.1', topic: 'Responsible AI principles',
    title: 'Name the principle a chatbot log breaks', estMinutes: 3,
    scenario: 'A support chatbot writes customers\' <mark>full card numbers into plain-text logs</mark> that many staff can read. Which principle is most at risk?',
    pair: 'Privacy vs Transparency',
    family: 'Responsible AI principles',
    steps: [
      { id: 's1', type: 'analyze', points: 1,
        prompt: 'Select the principle.',
        explanation: 'The tell is sensitive personal data stored where it is exposed. Protecting data and controlling access is privacy and security.',
        payload: {
          multi: false,
          lines: [
            { id: 'l1', text: 'Accountability', why: 'Accountability is about who owns and answers for the system, not how its data is protected.' },
            { id: 'l2', text: 'Fairness', why: 'Fairness is about comparable people getting comparable outcomes.' },
            { id: 'l3', text: 'Privacy and security' },
            { id: 'l4', text: 'Transparency', why: 'Transparency is about people understanding how the system works and its limits.' }
          ]
        },
        answer: { selected: ['l3'] } }
    ]
  },

  {
    id: 'ai900-dl-rai-3', cert: 'ai900', objective: '1.1', topic: 'Responsible AI principles',
    title: 'Name the principle behind an appeals route', estMinutes: 3,
    scenario: 'After an AI system declines an insurance claim, the insurer <mark>names the team that owns the decision</mark> and gives the customer a route to appeal. Which principle is this?',
    pair: 'Transparency vs Accountability',
    family: 'Responsible AI principles',
    steps: [
      { id: 's1', type: 'analyze', points: 1,
        prompt: 'Select the principle.',
        explanation: 'The tell is named ownership plus a way to challenge the outcome. People staying answerable for the AI system is accountability.',
        payload: {
          multi: false,
          lines: [
            { id: 'l1', text: 'Transparency', why: 'Transparency is about explaining how the system works. Naming an owner and an appeal route is about who answers for it.' },
            { id: 'l2', text: 'Inclusiveness', why: 'Inclusiveness is about the system working for people of all abilities and backgrounds.' },
            { id: 'l3', text: 'Reliability and safety', why: 'Reliability and safety is about the system behaving consistently and safely.' },
            { id: 'l4', text: 'Accountability' }
          ]
        },
        answer: { selected: ['l4'] } }
    ]
  },

  {
    id: 'ai900-dl-rai-4', cert: 'ai900', objective: '1.1', topic: 'Responsible AI principles',
    title: 'Match each situation to the principle at risk', estMinutes: 4,
    scenario: 'Four separate problems were found during a Responsible AI review of different AI apps.',
    pair: 'Fairness vs Inclusiveness',
    family: 'Responsible AI principles',
    steps: [
      { id: 's1', type: 'match', points: 1,
        prompt: 'Match each situation to the Responsible AI principle most at risk.',
        explanation: 'Unequal outcomes = fairness. Unexplained decisions = transparency. Unsafe behaviour on unusual input = reliability and safety. Unusable for some people = inclusiveness.',
        payload: {
          left: [
            { id: 'a1', label: 'A model gives women lower credit limits than men with the same income' },
            { id: 'a2', label: 'Users cannot find out why the app rejected their request' },
            { id: 'a3', label: 'A dosing assistant suggests doses ten times too high when weights are typed in pounds' },
            { id: 'a4', label: 'A voice app cannot understand people with speech impairments' }
          ],
          right: [
            { id: 'b3', label: 'Reliability and safety' },
            { id: 'b1', label: 'Fairness' },
            { id: 'b4', label: 'Inclusiveness' },
            { id: 'b2', label: 'Transparency' }
          ]
        },
        answer: { pairs: { a1: 'b1', a2: 'b2', a3: 'b3', a4: 'b4' } } }
    ]
  },

  {
    id: 'ai900-dl-rai-5', cert: 'ai900', objective: '1.1', topic: 'Responsible generative AI process',
    title: 'Put the responsible generative AI steps in order', estMinutes: 4,
    scenario: 'A team is planning how to release a customer-facing generative AI assistant responsibly.',
    steps: [
      { id: 's1', type: 'order', points: 1,
        prompt: 'Put the stages in the order a team works through them.',
        explanation: 'Microsoft\'s approach runs identify the potential harms, measure how often they occur, mitigate them in layers, then operate the solution responsibly after release.',
        payload: { items: [
          { id: 'o3', label: 'Mitigate the harms in layers' },
          { id: 'o1', label: 'Identify the potential harms' },
          { id: 'o4', label: 'Operate and monitor the solution after release' },
          { id: 'o2', label: 'Measure how often the harms occur' }
        ] },
        answer: { correctOrder: ['o1', 'o2', 'o3', 'o4'] } }
    ]
  },

  {
    id: 'ai900-dl-params-1', cert: 'ai900', objective: '1.2', topic: 'Model settings',
    title: 'Make replies more consistent', estMinutes: 3,
    scenario: 'A chat app gives very different wording each time the same question is asked. The business wants <mark>more consistent, predictable</mark> replies.',
    pair: 'Temperature vs Max tokens',
    family: 'Model settings',
    steps: [
      { id: 's1', type: 'analyze', points: 1,
        prompt: 'Select the change that helps most.',
        explanation: 'The tell is variety the business doesn\'t want. Temperature controls randomness, so lowering it makes replies more consistent.',
        payload: {
          multi: false,
          lines: [
            { id: 'l1', text: 'Raise max tokens', why: 'Max tokens only caps how long a reply can be. It does not change how varied the wording is.' },
            { id: 'l2', text: 'Lower the temperature' },
            { id: 'l3', text: 'Add a stop sequence', why: 'A stop sequence ends generation at a marker. It does not make wording consistent.' },
            { id: 'l4', text: 'Move the deployment to another region', why: 'Region decides where the model runs, not how random its replies are.' }
          ]
        },
        answer: { selected: ['l2'] } }
    ]
  },

  {
    id: 'ai900-dl-params-3', cert: 'ai900', objective: '1.2', topic: 'Model settings',
    title: 'Match each setting to its effect', estMinutes: 4,
    scenario: 'A developer is tuning a model deployment in the Microsoft Foundry playground.',
    pair: 'Temperature vs Max tokens',
    family: 'Model settings',
    steps: [
      { id: 's1', type: 'match', points: 1,
        prompt: 'Match each setting to what it controls.',
        explanation: 'Temperature tunes randomness, max tokens caps length, a stop sequence ends output at a marker, and the system message sets behaviour.',
        payload: {
          left: [
            { id: 'a1', label: 'Temperature' },
            { id: 'a2', label: 'Max tokens' },
            { id: 'a3', label: 'Stop sequence' },
            { id: 'a4', label: 'System message' }
          ],
          right: [
            { id: 'b4', label: 'The assistant\'s role, scope and rules' },
            { id: 'b2', label: 'The maximum length of a reply' },
            { id: 'b1', label: 'How random or creative the wording is' },
            { id: 'b3', label: 'Text that ends generation when it appears' }
          ]
        },
        answer: { pairs: { a1: 'b1', a2: 'b2', a3: 'b3', a4: 'b4' } } }
    ]
  },

  {
    id: 'ai900-dl-deploy-1', cert: 'ai900', objective: '1.2', topic: 'Deployment types',
    title: 'Pick the deployment for pay-per-token use', estMinutes: 3,
    scenario: 'A team wants to call a model from Microsoft Foundry with <mark>no infrastructure to manage</mark>, paying only for the tokens they use.',
    pair: 'Standard vs Provisioned',
    family: 'Deployment types',
    steps: [
      { id: 's1', type: 'analyze', points: 1,
        prompt: 'Select the deployment approach.',
        explanation: 'The tell is no infrastructure and pay per token. A standard deployment, such as Global Standard, is hosted by Microsoft and billed per token.',
        payload: {
          multi: false,
          lines: [
            { id: 'l1', text: 'Standard (pay-as-you-go) deployment' },
            { id: 'l2', text: 'Provisioned throughput deployment', why: 'Provisioned throughput reserves capacity that you pay for whether or not you use it, rather than paying per token.' },
            { id: 'l3', text: 'Managed compute on dedicated VMs', why: 'Managed compute runs the model on virtual machines you pay for while they run.' },
            { id: 'l4', text: 'Running the model on a local laptop', why: 'A laptop means managing your own hardware, and it gives no hosted endpoint billed per token.' }
          ]
        },
        answer: { selected: ['l1'] } }
    ]
  },

  {
    id: 'ai900-dl-deploy-2', cert: 'ai900', objective: '1.2', topic: 'Deployment types',
    title: 'Pick the deployment for reserved capacity', estMinutes: 3,
    scenario: 'A high-traffic production app needs <mark>predictable, reserved capacity</mark> so busy periods don\'t slow it down.',
    pair: 'Standard vs Provisioned',
    family: 'Deployment types',
    steps: [
      { id: 's1', type: 'analyze', points: 1,
        prompt: 'Select the deployment approach.',
        explanation: 'The tell is reserved, predictable capacity. Provisioned throughput reserves model capacity for steady performance at high volume.',
        payload: {
          multi: false,
          lines: [
            { id: 'l1', text: 'Standard pay-per-token deployment', why: 'Pay-per-token suits variable use but does not reserve capacity.' },
            { id: 'l2', text: 'Global Standard deployment', why: 'Global Standard routes traffic across regions and bills per token, but it does not reserve capacity.' },
            { id: 'l3', text: 'Provisioned throughput deployment' },
            { id: 'l4', text: 'Batch deployment', why: 'Batch processes large jobs asynchronously at lower cost, which suits offline work rather than busy live traffic.' }
          ]
        },
        answer: { selected: ['l3'] } }
    ]
  },

  {
    id: 'ai900-dl-model-2', cert: 'ai900', objective: '1.2', topic: 'Choosing a model',
    title: 'Pick a model for semantic search', estMinutes: 3,
    scenario: 'A company wants staff to <mark>search thousands of policy documents by meaning</mark>, not just matching keywords.',
    pair: 'Multimodal vs Embeddings',
    family: 'Model types',
    steps: [
      { id: 's1', type: 'analyze', points: 1,
        prompt: 'Select the type of model.',
        explanation: 'The tell is search by meaning. Embeddings models turn text into vectors so passages with similar meaning sit close together.',
        payload: {
          multi: false,
          lines: [
            { id: 'l1', text: 'An image generation model', why: 'Image generation creates pictures and cannot search text.' },
            { id: 'l2', text: 'A text to speech model', why: 'Text to speech produces audio.' },
            { id: 'l3', text: 'A small chat model with no data', why: 'A chat model alone does not index or search documents.' },
            { id: 'l4', text: 'An embeddings model' }
          ]
        },
        answer: { selected: ['l4'] } }
    ]
  },

  {
    id: 'ai900-dl-ground-1', cert: 'ai900', objective: '1.2', topic: 'Grounding',
    title: 'Keep answers current without retraining', estMinutes: 3,
    scenario: 'A chatbot must answer from the company\'s HR policies, which <mark>change every month</mark>. The team doesn\'t want to retrain anything when they change.',
    pair: 'Grounding vs Fine-tuning',
    family: 'Model customisation',
    steps: [
      { id: 's1', type: 'analyze', points: 1,
        prompt: 'Select the approach.',
        explanation: 'The tell is frequently changing documents with no retraining. Grounding retrieves the current policies and adds them to the prompt at question time.',
        payload: {
          multi: false,
          lines: [
            { id: 'l1', text: 'Ground the prompt with retrieved policy text' },
            { id: 'l2', text: 'Fine-tune the model again every time a policy changes', why: 'Fine-tuning bakes data into the model and has to be repeated each time the policies change.' },
            { id: 'l3', text: 'Raise the temperature', why: 'Temperature changes randomness and adds no knowledge.' },
            { id: 'l4', text: 'Use a larger context window alone', why: 'A bigger window only helps if the policy text is actually supplied.' }
          ]
        },
        answer: { selected: ['l1'] } }
    ]
  },

  {
    id: 'ai900-dl-work-1', cert: 'ai900', objective: '1.3', topic: 'Generative vs agentic AI',
    title: 'Pick the solution that takes actions', estMinutes: 3,
    scenario: 'A sales team wants AI that reads each new lead, <mark>looks it up in the CRM and drafts a follow-up email</mark> for a person to approve.',
    pair: 'Agent vs Chat completion',
    family: 'AI workloads',
    steps: [
      { id: 's1', type: 'analyze', points: 1,
        prompt: 'Select the kind of solution.',
        explanation: 'The tell is several steps that act on business systems. An agent combines a model, instructions and tools to carry out multi-step tasks.',
        payload: {
          multi: false,
          lines: [
            { id: 'l1', text: 'A single chat completion', why: 'One prompt and one reply cannot look things up in the CRM or work through several steps.' },
            { id: 'l2', text: 'Sentiment analysis', why: 'Sentiment analysis judges opinion and takes no actions.' },
            { id: 'l3', text: 'An agent with tools' },
            { id: 'l4', text: 'Image classification', why: 'Image classification labels pictures.' }
          ]
        },
        answer: { selected: ['l3'] } }
    ]
  },

  {
    id: 'ai900-dl-work-4', cert: 'ai900', objective: '1.3', topic: 'Speech',
    title: 'Pick the capability for live captions', estMinutes: 3,
    scenario: 'A conference app must show <mark>captions while speakers are talking</mark>.',
    pair: 'Speech to text vs Text to speech',
    family: 'Azure Speech features',
    steps: [
      { id: 's1', type: 'analyze', points: 1,
        prompt: 'Select the capability.',
        explanation: 'The tell is turning live speech into text. That is speech recognition (speech to text).',
        payload: {
          multi: false,
          lines: [
            { id: 'l1', text: 'Speech to text' },
            { id: 'l2', text: 'Text to speech', why: 'Text to speech turns text into audio, the opposite direction.' },
            { id: 'l3', text: 'Custom voice', why: 'Custom voice creates a branded synthetic voice for output.' },
            { id: 'l4', text: 'Speaker diarization alone', why: 'Diarization labels who spoke when, but it needs transcription to produce captions.' }
          ]
        },
        answer: { selected: ['l1'] } }
    ]
  },

  {
    id: 'ai900-dl-work-5', cert: 'ai900', objective: '1.3', topic: 'Computer vision',
    title: 'Pick the vision task for counting items', estMinutes: 3,
    scenario: 'A warehouse camera must <mark>find each pallet and draw a box around it</mark> so they can be counted.',
    pair: 'Object detection vs Classification',
    family: 'Vision tasks',
    steps: [
      { id: 's1', type: 'analyze', points: 1,
        prompt: 'Select the computer vision task.',
        explanation: 'The tell is locating each item with a box. Object detection returns positions for every object it finds.',
        payload: {
          multi: false,
          lines: [
            { id: 'l1', text: 'Image classification', why: 'Classification gives one label for the whole image without locating items.' },
            { id: 'l2', text: 'Optical character recognition', why: 'OCR reads text in the image.' },
            { id: 'l3', text: 'Object detection' },
            { id: 'l4', text: 'Image generation', why: 'Image generation creates new pictures.' }
          ]
        },
        answer: { selected: ['l3'] } }
    ]
  },

  {
    id: 'ai900-dl-work-6', cert: 'ai900', objective: '1.3', topic: 'Information extraction',
    title: 'Tell extraction apart from summarization', estMinutes: 3,
    scenario: 'A recruiter has hundreds of CVs and wants <mark>each candidate\'s skills and years of experience stored as fields</mark> in a database.',
    pair: 'Extraction vs Summarization',
    family: 'AI workloads',
    steps: [
      { id: 's1', type: 'analyze', points: 1,
        prompt: 'Select the workload.',
        explanation: 'The tell is specific values saved as fields. That is information extraction, not a shorter readable version.',
        payload: {
          multi: false,
          lines: [
            { id: 'l1', text: 'Summarization', why: 'Summarization writes a shorter version in prose, not database fields.' },
            { id: 'l2', text: 'Information extraction' },
            { id: 'l3', text: 'Key phrase extraction', why: 'Key phrases list topics, not specific values stored as fields.' },
            { id: 'l4', text: 'Sentiment analysis', why: 'Sentiment analysis judges the tone of the text.' }
          ]
        },
        answer: { selected: ['l2'] } }
    ]
  },

  {
    id: 'ai900-dl-work-7', cert: 'ai900', objective: '1.3', topic: 'Matching workloads to tools',
    title: 'Sort each need into the best fit', estMinutes: 4,
    scenario: 'An operations lead lists six AI needs for different teams.',
    pair: 'Language vs Speech vs Content Understanding',
    family: 'Foundry tools by workload',
    steps: [
      { id: 's1', type: 'categorize', points: 1,
        prompt: 'Sort each need into the tool that fits best.',
        explanation: 'Text analytics = Azure Language. Audio in or out = Azure Speech. Reasoning about an image in words = a multimodal model. Structured fields from documents or media = Content Understanding.',
        payload: {
          items: [
            { id: 'i1', label: 'Find the sentiment of customer emails' },
            { id: 'i2', label: 'Redact phone numbers from chat logs' },
            { id: 'i3', label: 'Show live captions during a webinar' },
            { id: 'i4', label: 'Read replies aloud in a branded voice' },
            { id: 'i5', label: 'Answer questions about an uploaded photo' },
            { id: 'i6', label: 'Pull totals and due dates from invoices' }
          ],
          buckets: [
            { id: 'k1', label: 'Azure Language' },
            { id: 'k2', label: 'Azure Speech' },
            { id: 'k3', label: 'Multimodal model' },
            { id: 'k4', label: 'Content Understanding' }
          ]
        },
        answer: { map: { i1: 'k1', i2: 'k1', i3: 'k2', i4: 'k2', i5: 'k3', i6: 'k4' } } }
    ]
  },

  {
    id: 'ai900-dl-work-8', cert: 'ai900', objective: '1.3', topic: 'Generative AI',
    title: 'Spot the generative AI workload', estMinutes: 3,
    scenario: 'A retailer has four AI ideas and wants to know which one is <mark>generative</mark> AI.',
    pair: 'Generative vs Analytical AI',
    family: 'AI workloads',
    steps: [
      { id: 's1', type: 'analyze', points: 1,
        prompt: 'Select the generative AI workload.',
        explanation: 'The tell is creating new content. Drafting product descriptions from bullet points generates new text.',
        payload: {
          multi: false,
          lines: [
            { id: 'l1', text: 'Counting customers in store camera images', why: 'Counting people is object detection, a vision analysis task.' },
            { id: 'l2', text: 'Detecting the language of support emails', why: 'Language detection analyses text rather than creating it.' },
            { id: 'l3', text: 'Flagging negative reviews', why: 'Flagging negative reviews is sentiment analysis.' },
            { id: 'l4', text: 'Drafting product descriptions from bullet points' }
          ]
        },
        answer: { selected: ['l4'] } }
    ]
  },

  {
    id: 'ai900-dl-app-1', cert: 'ai900', objective: '2.1', topic: 'System vs user messages',
    title: 'Place the rule that applies to every reply', estMinutes: 3,
    scenario: 'A travel company\'s chat app must <mark>only answer questions about its travel policy</mark>, for every user and every question.',
    pair: 'System vs User message',
    family: 'Generative AI apps & agents',
    steps: [
      { id: 's1', type: 'analyze', points: 1,
        prompt: 'Select where the rule belongs.',
        explanation: 'The tell is a rule for the whole conversation. The system message sets role, scope and rules that apply to every reply.',
        payload: {
          multi: false,
          lines: [
            { id: 'l1', text: 'In the system message' },
            { id: 'l2', text: 'In each user message', why: 'User messages hold the person\'s request. Users should not have to repeat the rules.' },
            { id: 'l3', text: 'In the temperature setting', why: 'Temperature controls randomness, not which topics are allowed.' },
            { id: 'l4', text: 'In the deployment name', why: 'The deployment name only selects which model answers.' }
          ]
        },
        answer: { selected: ['l1'] } }
    ]
  },

  {
    id: 'ai900-dl-app-2', cert: 'ai900', objective: '2.1', topic: 'Foundry SDK chat clients',
    title: 'Identify what the model argument names', estMinutes: 3,
    scenario: 'A developer calls a model deployed in Microsoft Foundry using <mark>client.chat.completions.create(model="support-bot", messages=msgs)</mark>.',
    pair: 'Deployment name vs Endpoint',
    family: 'Generative AI apps & agents',
    steps: [
      { id: 's1', type: 'analyze', points: 1,
        prompt: 'Select what "support-bot" refers to.',
        explanation: 'The tell is the model argument in an Azure-hosted call. It is the deployment name chosen when the model was deployed.',
        payload: {
          multi: false,
          lines: [
            { id: 'l1', text: 'The model family\'s official name', why: 'You choose the deployment name, and it does not have to match the model\'s name.' },
            { id: 'l2', text: 'The Azure region of the resource', why: 'The region is part of the resource and endpoint, not this argument.' },
            { id: 'l3', text: 'The deployment name' },
            { id: 'l4', text: 'The title of the system message', why: 'The system message is a message with the system role.' }
          ]
        },
        answer: { selected: ['l3'] } }
    ]
  },

  {
    id: 'ai900-dl-app-3', cert: 'ai900', objective: '2.1', topic: 'Prompt engineering',
    title: 'Pick the prompt change for consistent JSON', estMinutes: 3,
    scenario: 'A dashboard needs a model to return <mark>the same JSON fields every time</mark>, but the output keeps changing shape.',
    pair: 'Few-shot vs Instructions',
    family: 'Generative AI apps & agents',
    steps: [
      { id: 's1', type: 'analyze', points: 1,
        prompt: 'Select the most effective change.',
        explanation: 'The tell is consistent structure. Naming the exact fields and showing an example output gives the model a pattern to follow. Structured outputs (a JSON schema) enforce this even more strictly.',
        payload: {
          multi: false,
          lines: [
            { id: 'l1', text: 'Ask the model to be creative with the layout', why: 'Asking for creativity invites more variation, not less.' },
            { id: 'l2', text: 'Name the exact fields and show an example' },
            { id: 'l3', text: 'Raise the temperature', why: 'A higher temperature makes output less consistent.' },
            { id: 'l4', text: 'Tell the model to always return JSON', why: 'Instructions alone often still let field names drift. Naming the fields and showing an example fixes the shape.' }
          ]
        },
        answer: { selected: ['l2'] } }
    ]
  },

  {
    id: 'ai900-dl-app-7', cert: 'ai900', objective: '2.1', topic: 'Agent instructions',
    title: 'Fix an agent that answers out of scope', estMinutes: 3,
    scenario: 'An HR agent keeps answering questions about <mark>individual colleagues\' salaries</mark>, which it should decline.',
    pair: 'Instructions vs Tools',
    family: 'Agent tools',
    steps: [
      { id: 's1', type: 'analyze', points: 1,
        prompt: 'Select the first fix.',
        explanation: 'The tell is behaviour outside the intended scope. An agent\'s instructions define its role and what it must refuse, so update them first. Where possible, also remove its access to salary data, because instructions alone are not a hard control.',
        payload: {
          multi: false,
          lines: [
            { id: 'l1', text: 'Switch to a larger and more capable model', why: 'A bigger model is more capable but does not by itself narrow the scope.' },
            { id: 'l2', text: 'Update its instructions to decline these' },
            { id: 'l3', text: 'Add more tools', why: 'More tools extend what the agent can do instead of restricting it.' },
            { id: 'l4', text: 'Raise max tokens', why: 'Max tokens only limits reply length.' }
          ]
        },
        answer: { selected: ['l2'] } }
    ]
  },

  {
    id: 'ai900-dl-app-8', cert: 'ai900', objective: '2.1', topic: 'Agent client apps',
    title: 'Keep follow-up questions in context', estMinutes: 3,
    scenario: 'A client app chats with a Microsoft Foundry agent. Follow-up questions such as <mark>\'and what about next week?\'</mark> must make sense to the agent.',
    pair: 'Conversation vs New session',
    family: 'Generative AI apps & agents',
    steps: [
      { id: 's1', type: 'analyze', points: 1,
        prompt: 'Select what the app should do.',
        explanation: 'The tell is follow-ups that depend on earlier turns. Reusing the same conversation keeps the history together.',
        payload: {
          multi: false,
          lines: [
            { id: 'l1', text: 'Start a new conversation for every message', why: 'A new conversation loses the earlier context the follow-up depends on.' },
            { id: 'l2', text: 'Redeploy the agent for each message', why: 'Agents are created once and reused.' },
            { id: 'l3', text: 'Raise the temperature', why: 'Temperature does not give the agent memory of earlier turns.' },
            { id: 'l4', text: 'Keep using the same conversation' }
          ]
        },
        answer: { selected: ['l4'] } }
    ]
  },

  {
    id: 'ai900-dl-app-9', cert: 'ai900', objective: '2.1', topic: 'Agent client apps',
    title: 'Show the answer as it is written', estMinutes: 3,
    scenario: 'A client app should <mark>display the agent\'s answer progressively</mark> instead of waiting for the full reply.',
    pair: 'Streaming vs Batch',
    family: 'Generative AI apps & agents',
    steps: [
      { id: 's1', type: 'analyze', points: 1,
        prompt: 'Select the approach.',
        explanation: 'The tell is showing text as it is generated. Streaming the response delivers it in chunks.',
        payload: {
          multi: false,
          lines: [
            { id: 'l1', text: 'Stream the response' },
            { id: 'l2', text: 'Raise max tokens', why: 'Max tokens limits length and does not change how the reply is delivered.' },
            { id: 'l3', text: 'Add a second agent', why: 'Another agent does not stream the first one\'s answer.' },
            { id: 'l4', text: 'Ask for a shorter reply', why: 'A shorter reply still arrives all at once at the end.' }
          ]
        },
        answer: { selected: ['l1'] } }
    ]
  },

  {
    id: 'ai900-dl-app-10', cert: 'ai900', objective: '2.1', topic: 'Building an agent',
    title: 'Put the steps to build an agent in order', estMinutes: 4,
    scenario: 'A developer is building a single agent in Microsoft Foundry and a lightweight client app for it.',
    steps: [
      { id: 's1', type: 'order', points: 1,
        prompt: 'Put the steps in a sensible order.',
        explanation: 'An agent needs a deployed model first, then the agent itself with its instructions and tools, then testing in the portal playground, and only then a client app that calls it.',
        payload: { items: [
          { id: 'o3', label: 'Test the agent in the playground' },
          { id: 'o1', label: 'Deploy a model in the project' },
          { id: 'o4', label: 'Call the agent from a client app' },
          { id: 'o2', label: 'Create the agent with its instructions and tools' }
        ] },
        answer: { correctOrder: ['o1', 'o2', 'o3', 'o4'] } }
    ]
  },

  {
    id: 'ai900-dl-app-11', cert: 'ai900', objective: '2.1', topic: 'Deploying models',
    title: 'Try a new model version safely', estMinutes: 3,
    scenario: 'A team wants to <mark>try a newer model version</mark> without disrupting the app that uses the current deployment.',
    family: 'Generative AI apps & agents',
    steps: [
      { id: 's1', type: 'analyze', points: 1,
        prompt: 'Select the approach.',
        explanation: 'The tell is testing without disruption. A separate deployment lets the team evaluate the new version, then switch the app over.',
        payload: {
          multi: false,
          lines: [
            { id: 'l1', text: 'Delete the current deployment first', why: 'Deleting first takes the app offline.' },
            { id: 'l2', text: 'Change the version number in the system message', why: 'The system message steers behaviour and cannot change the model.' },
            { id: 'l3', text: 'Deploy the new version separately and test it' },
            { id: 'l4', text: 'Raise the temperature on the requests', why: 'Temperature changes randomness, not the model version.' }
          ]
        },
        answer: { selected: ['l3'] } }
    ]
  },

  {
    id: 'ai900-dl-text-1', cert: 'ai900', objective: '2.2', topic: 'Azure Language',
    title: 'Redact personal details before publishing', estMinutes: 3,
    scenario: 'Reviews must be published with <mark>phone numbers and email addresses hidden</mark>.',
    pair: 'PII vs Entities',
    family: 'Azure Language features',
    steps: [
      { id: 's1', type: 'analyze', points: 1,
        prompt: 'Select the Azure Language feature.',
        explanation: 'The tell is finding and masking personal data. PII detection returns the entities found and a redacted version of the text.',
        payload: {
          multi: false,
          lines: [
            { id: 'l1', text: 'Named entity recognition', why: 'NER categorises names and places but is not built to redact personal data.' },
            { id: 'l2', text: 'Key phrase extraction', why: 'Key phrases are main topics, not personal details.' },
            { id: 'l3', text: 'Summarization', why: 'Summarization shortens the text without hiding personal details.' },
            { id: 'l4', text: 'PII detection' }
          ]
        },
        answer: { selected: ['l4'] } }
    ]
  },

  {
    id: 'ai900-dl-text-2', cert: 'ai900', objective: '2.2', topic: 'Azure Language',
    title: 'Read a two-sentence review correctly', estMinutes: 3,
    scenario: 'An app sends <mark>\'The delivery was awful. The staff were lovely.\'</mark> to Azure Language sentiment analysis.',
    pair: 'Sentiment vs Opinion mining',
    family: 'Azure Language features',
    steps: [
      { id: 's1', type: 'analyze', points: 1,
        prompt: 'Select the most likely result.',
        explanation: 'The tell is one negative sentence and one positive sentence. The document is labelled mixed, and each sentence gets its own label and scores.',
        payload: {
          multi: false,
          lines: [
            { id: 'l1', text: 'Mixed for the document, a label per sentence' },
            { id: 'l2', text: 'Neutral for the whole text', why: 'Each sentence carries a clear opinion, one negative and one positive.' },
            { id: 'l3', text: 'Positive, because the last sentence wins', why: 'Sentiment analysis does not simply take the last sentence.' },
            { id: 'l4', text: 'A list of the people mentioned', why: 'That is named entity recognition.' }
          ]
        },
        answer: { selected: ['l1'] } }
    ]
  },

  {
    id: 'ai900-dl-text-3', cert: 'ai900', objective: '2.2', topic: 'Azure Language',
    title: 'Handle reviews in many languages', estMinutes: 3,
    scenario: 'Reviews arrive in <mark>several languages</mark>, and each must get sentiment analysis in the right language.',
    pair: 'Language detection vs Key phrases',
    family: 'Azure Language features',
    steps: [
      { id: 's1', type: 'analyze', points: 1,
        prompt: 'Select what should happen first.',
        explanation: 'The tell is unknown languages arriving. Detecting each review\'s language first lets the app send the right language to the sentiment step.',
        payload: {
          multi: false,
          lines: [
            { id: 'l1', text: 'Run key phrase extraction', why: 'Key phrases do not tell the app which language each review is in.' },
            { id: 'l2', text: 'Detect each review\'s language' },
            { id: 'l3', text: 'Convert each review to speech', why: 'Speech output does not identify the language.' },
            { id: 'l4', text: 'Run PII detection', why: 'PII detection finds personal data, not the language.' }
          ]
        },
        answer: { selected: ['l2'] } }
    ]
  },

  {
    id: 'ai900-dl-speech-4', cert: 'ai900', objective: '2.2', topic: 'Spoken prompts',
    title: 'Choose between a multimodal model and Azure Speech', estMinutes: 3,
    scenario: 'A team could send spoken questions straight to a multimodal model, but compliance needs a <mark>stored written transcript with word timings</mark> of every call.',
    pair: 'Multimodal audio vs Azure Speech',
    family: 'Azure Speech features',
    steps: [
      { id: 's1', type: 'analyze', points: 1,
        prompt: 'Select the best approach.',
        explanation: 'The tell is a detailed, timed transcript as a record. Azure Speech is built for accurate transcription with timing information.',
        payload: {
          multi: false,
          lines: [
            { id: 'l1', text: 'Send the audio to a multimodal model only', why: 'A multimodal model answers the question. It is not built to return a timed transcript you can store as a record.' },
            { id: 'l2', text: 'Transcribe with Azure Speech' },
            { id: 'l3', text: 'Use an image generation model', why: 'Image models do not process audio.' },
            { id: 'l4', text: 'Use text to speech', why: 'Text to speech produces audio rather than transcripts.' }
          ]
        },
        answer: { selected: ['l2'] } }
    ]
  },

  {
    id: 'ai900-dl-vision-1', cert: 'ai900', objective: '2.3', topic: 'Visual input',
    title: 'Answer a question about a photo', estMinutes: 3,
    scenario: 'A customer uploads a photo of a restaurant menu and asks <mark>which dishes are vegetarian</mark>.',
    pair: 'Multimodal vs OCR',
    family: 'Vision & image models',
    steps: [
      { id: 's1', type: 'analyze', points: 1,
        prompt: 'Select the approach.',
        explanation: 'The tell is reasoning about what the image shows. A multimodal model can read the menu and answer in one request.',
        payload: {
          multi: false,
          lines: [
            { id: 'l1', text: 'Run OCR on the menu text and then discard the image', why: 'OCR alone returns raw text and doesn\'t answer the question.' },
            { id: 'l2', text: 'Run image classification', why: 'Classification returns a label for the whole image.' },
            { id: 'l3', text: 'Run text to speech on the menu', why: 'Speech output doesn\'t answer anything.' },
            { id: 'l4', text: 'Send the image and question to a multimodal model' }
          ]
        },
        answer: { selected: ['l4'] } }
    ]
  },

  {
    id: 'ai900-dl-vision-2', cert: 'ai900', objective: '2.3', topic: 'Image generation',
    title: 'Set the size of generated images', estMinutes: 3,
    scenario: 'A website needs generated banner images in a <mark>wide landscape size</mark>.',
    pair: 'Prompt vs Size setting',
    family: 'Vision & image models',
    steps: [
      { id: 's1', type: 'analyze', points: 1,
        prompt: 'Select where this is set.',
        explanation: 'The tell is image dimensions. Image generation requests take a size setting alongside the prompt, chosen from the sizes the model supports.',
        payload: {
          multi: false,
          lines: [
            { id: 'l1', text: 'The size setting of the image request' },
            { id: 'l2', text: 'The system message of a chat model', why: 'A chat model\'s system message does not control image dimensions.' },
            { id: 'l3', text: 'The max tokens value', why: 'Max tokens limits text length, not image size.' },
            { id: 'l4', text: 'The Azure region of the resource', why: 'Region decides where the model runs.' }
          ]
        },
        answer: { selected: ['l1'] } }
    ]
  },

  {
    id: 'ai900-dl-vision-3', cert: 'ai900', objective: '2.3', topic: 'Image generation',
    title: 'Change the background of an existing photo', estMinutes: 3,
    scenario: 'A marketing team wants <mark>new versions of an existing product photo</mark> with a different background.',
    pair: 'Image editing vs Analysis',
    family: 'Vision & image models',
    steps: [
      { id: 's1', type: 'analyze', points: 1,
        prompt: 'Select the capability.',
        explanation: 'The tell is changing an existing image. Some image generation models accept an input image plus a prompt to edit it.',
        payload: {
          multi: false,
          lines: [
            { id: 'l1', text: 'Optical character recognition on the photo', why: 'OCR reads text in images.' },
            { id: 'l2', text: 'Object detection', why: 'Object detection locates items but does not change them.' },
            { id: 'l3', text: 'Image editing with a generation model' },
            { id: 'l4', text: 'Speech synthesis', why: 'Speech synthesis produces audio.' }
          ]
        },
        answer: { selected: ['l3'] } }
    ]
  },

  {
    id: 'ai900-dl-vision-4', cert: 'ai900', objective: '2.3', topic: 'Vision apps',
    title: 'Get values the app can read reliably', estMinutes: 3,
    scenario: 'A vision app asks a multimodal model for the expiry date on food packaging, but its code <mark>struggles to parse free-text answers</mark>.',
    pair: 'Structured output vs Free text',
    family: 'Vision & image models',
    steps: [
      { id: 's1', type: 'analyze', points: 1,
        prompt: 'Select the change.',
        explanation: 'The tell is code needing predictable output. Asking for a structured format such as JSON makes the answer easy to read reliably. Structured outputs (a JSON schema) enforce this even more strictly.',
        payload: {
          multi: false,
          lines: [
            { id: 'l1', text: 'Send the photo as audio', why: 'Audio would lose the image entirely.' },
            { id: 'l2', text: 'Ask for the answer as JSON with a set field' },
            { id: 'l3', text: 'Remove the instruction and send only the photo', why: 'Without an instruction the model may describe the photo instead.' },
            { id: 'l4', text: 'Raise the temperature', why: 'A higher temperature makes output less predictable.' }
          ]
        },
        answer: { selected: ['l2'] } }
    ]
  },

  {
    id: 'ai900-dl-vision-5', cert: 'ai900', objective: '2.3', topic: 'Image generation',
    title: 'Explain a refused image request', estMinutes: 3,
    scenario: 'An image generation request for a <mark>violent scene</mark> is refused by the service.',
    pair: 'Guardrails vs Settings',
    family: 'Vision & image models',
    steps: [
      { id: 's1', type: 'analyze', points: 1,
        prompt: 'Select the most likely reason.',
        explanation: 'The tell is harmful content in the prompt. Guardrails (previously called content filters) screen prompts and block harmful requests, which is the most likely cause here.',
        payload: {
          multi: false,
          lines: [
            { id: 'l1', text: 'Guardrails blocked the harmful prompt' },
            { id: 'l2', text: 'The request exceeded the rate limit', why: 'Exceeding the rate limit returns a throttling error, not a content refusal.' },
            { id: 'l3', text: 'The requested size is not supported', why: 'An unsupported size returns a parameter error, not a content refusal.' },
            { id: 'l4', text: 'The model was deployed recently', why: 'New deployments work normally.' }
          ]
        },
        answer: { selected: ['l1'] } }
    ]
  },

  {
    id: 'ai900-dl-cu-1', cert: 'ai900', objective: '2.4', topic: 'Content Understanding',
    title: 'Extract fields from standard receipts', estMinutes: 3,
    scenario: 'A team needs common fields from <mark>standard receipts</mark> and doesn\'t want to design a schema from scratch.',
    pair: 'Prebuilt vs Custom analyzer',
    family: 'Content Understanding',
    steps: [
      { id: 's1', type: 'analyze', points: 1,
        prompt: 'Select the starting point.',
        explanation: 'The tell is a standard document type with no custom design. A prebuilt analyzer extracts common fields out of the box.',
        payload: {
          multi: false,
          lines: [
            { id: 'l1', text: 'A custom analyzer with a new field schema', why: 'The team does not want to design a schema, and receipts are a standard type a prebuilt analyzer already covers.' },
            { id: 'l2', text: 'An image generation model', why: 'Image generation creates pictures.' },
            { id: 'l3', text: 'A prebuilt analyzer' },
            { id: 'l4', text: 'A provisioned throughput deployment', why: 'That reserves model capacity and extracts nothing.' }
          ]
        },
        answer: { selected: ['l3'] } }
    ]
  },

  {
    id: 'ai900-dl-cu-2', cert: 'ai900', objective: '2.4', topic: 'Content Understanding',
    title: 'Extract unusual fields from contracts', estMinutes: 3,
    scenario: 'Contracts need fields such as <mark>renewal notice period and penalty clause</mark>, which no prebuilt analyzer covers.',
    pair: 'Prebuilt vs Custom analyzer',
    family: 'Content Understanding',
    steps: [
      { id: 's1', type: 'analyze', points: 1,
        prompt: 'Select the approach.',
        explanation: 'The tell is fields no prebuilt analyzer offers. A custom analyzer with your own field schema handles them.',
        payload: {
          multi: false,
          lines: [
            { id: 'l1', text: 'A prebuilt receipt analyzer with its default fields', why: 'A receipt analyzer extracts receipt fields, not contract terms.' },
            { id: 'l2', text: 'Azure Speech batch transcription', why: 'Transcription is for audio.' },
            { id: 'l3', text: 'Key phrase extraction', why: 'Key phrases list topics but don\'t fill defined fields.' },
            { id: 'l4', text: 'A custom analyzer with its own field schema' }
          ]
        },
        answer: { selected: ['l4'] } }
    ]
  },

  {
    id: 'ai900-dl-cu-3', cert: 'ai900', objective: '2.4', topic: 'Information extraction apps',
    title: 'Handle a low-confidence field', estMinutes: 3,
    scenario: 'An extraction app gets <mark>VendorName with a confidence of 0.42</mark> from Content Understanding.',
    pair: 'Confidence vs Validation',
    family: 'Content Understanding',
    steps: [
      { id: 's1', type: 'analyze', points: 1,
        prompt: 'Select what the app should do.',
        explanation: 'The tell is a low confidence score. The value may be wrong, so it should go to a person for review before it is used.',
        payload: {
          multi: false,
          lines: [
            { id: 'l1', text: 'Send it for human review' },
            { id: 'l2', text: 'Accept it because a value was returned', why: 'A returned value can still be wrong.' },
            { id: 'l3', text: 'Delete the field from the schema', why: 'The field is still needed; only this value is uncertain.' },
            { id: 'l4', text: 'Raise the temperature and retry', why: 'Temperature is a chat setting and doesn\'t fix extraction confidence.' }
          ]
        },
        answer: { selected: ['l1'] } }
    ]
  },

  {
    id: 'ai900-dl-cu-4', cert: 'ai900', objective: '2.4', topic: 'Information extraction apps',
    title: 'Catch an impossible extracted value', estMinutes: 3,
    scenario: 'Content Understanding returns <mark>InvoiceDate (string field): 2026-09-31</mark> with high confidence.',
    pair: 'Confidence vs Validation',
    family: 'Content Understanding',
    steps: [
      { id: 's1', type: 'analyze', points: 1,
        prompt: 'Select what the app should do.',
        explanation: 'The tell is a value that breaks a real-world rule. September has 30 days, so validation should flag it even though confidence is high.',
        payload: {
          multi: false,
          lines: [
            { id: 'l1', text: 'Save it, because confidence is high', why: 'High confidence doesn\'t make an impossible date valid.' },
            { id: 'l2', text: 'Flag it, because the date does not exist' },
            { id: 'l3', text: 'Lower the confidence threshold so it passes', why: 'The confidence is already high. The problem is a date that does not exist, not the threshold.' },
            { id: 'l4', text: 'Move the deployment to another region', why: 'Region has nothing to do with the value.' }
          ]
        },
        answer: { selected: ['l2'] } }
    ]
  },

  {
    id: 'ai900-dl-cu-5', cert: 'ai900', objective: '2.4', topic: 'Content Understanding',
    title: 'Pull structure out of recorded calls', estMinutes: 3,
    scenario: 'A support team wants each recorded call turned into fields: <mark>caller intent, product mentioned and outcome</mark>.',
    pair: 'Language vs Speech vs Content Understanding',
    family: 'Foundry tools by workload',
    steps: [
      { id: 's1', type: 'analyze', points: 1,
        prompt: 'Select the tool.',
        explanation: 'The tell is structured fields from audio. Content Understanding can analyse audio and return the fields you define.',
        payload: {
          multi: false,
          lines: [
            { id: 'l1', text: 'Text to speech', why: 'Text to speech produces audio rather than analysing it.' },
            { id: 'l2', text: 'Image classification', why: 'Image classification labels pictures.' },
            { id: 'l3', text: 'Content Understanding on the audio' },
            { id: 'l4', text: 'A text-only chat model with no audio input', why: 'A text-only model cannot process the recordings.' }
          ]
        },
        answer: { selected: ['l3'] } }
    ]
  },

  {
    id: 'ai900-dl-cu-6', cert: 'ai900', objective: '2.4', topic: 'Information extraction apps',
    title: 'Put an extraction app\'s flow in order', estMinutes: 4,
    scenario: 'A finance team is building an app that puts invoice fields into its accounting system.',
    steps: [
      { id: 's1', type: 'order', points: 1,
        prompt: 'Put the steps in order.',
        explanation: 'Define what to extract first, then analyze each invoice, check confidence and validate the values, and only then save them.',
        payload: { items: [
          { id: 'o2', label: 'Analyze each new invoice' },
          { id: 'o4', label: 'Save the approved fields to the accounting system' },
          { id: 'o1', label: 'Define the field schema' },
          { id: 'o3', label: 'Check confidence and validate the values' }
        ] },
        answer: { correctOrder: ['o1', 'o2', 'o3', 'o4'] } }
    ]
  },

  {
    id: 'ai900-dl-cu-7', cert: 'ai900', objective: '2.4', topic: 'Content Understanding',
    title: 'Match each input to what can be extracted', estMinutes: 4,
    scenario: 'A media company is planning Content Understanding analyzers for different content.',
    pair: 'Content Understanding modalities',
    family: 'Content Understanding',
    steps: [
      { id: 's1', type: 'match', points: 1,
        prompt: 'Match each content type to a fitting extraction.',
        explanation: 'Content Understanding works across documents, images, audio and video, returning fields you define for each.',
        payload: {
          left: [
            { id: 'a1', label: 'Scanned contract PDF' },
            { id: 'a2', label: 'Product photo' },
            { id: 'a3', label: 'Recorded sales call' },
            { id: 'a4', label: 'Training video' }
          ],
          right: [
            { id: 'b2', label: 'Product type and colour' },
            { id: 'b4', label: 'Chapters with timestamps' },
            { id: 'b1', label: 'Parties, dates and notice period' },
            { id: 'b3', label: 'Transcript plus customer intent' }
          ]
        },
        answer: { pairs: { a1: 'b1', a2: 'b2', a3: 'b3', a4: 'b4' } } }
    ]
  },

  {
    id: 'ai900-dl-rai-6', cert: 'ai900', objective: '1.1', topic: 'Responsible generative AI',
    title: 'Pick the user experience mitigation', estMinutes: 3,
    scenario: 'A team is listing safety mitigations for its generative AI app and wants one that belongs in the <mark>user experience layer</mark>.',
    pair: 'Safety layers',
    family: 'Responsible AI principles',
    steps: [
      { id: 's1', type: 'analyze', points: 1,
        prompt: 'Select the user experience mitigation.',
        explanation: 'The tell is the user experience layer. Telling users the answers are AI-generated and may be wrong is part of how the app presents AI output responsibly.',
        payload: {
          multi: false,
          lines: [
            { id: 'l1', text: 'Block harmful prompts before they reach the model', why: 'Screening prompts is the job of guardrails in the safety system layer.' },
            { id: 'l2', text: 'Pick the model with the best safety evaluation', why: 'Model selection sits in the model layer.' },
            { id: 'l3', text: 'Instruct the model to cite its sources', why: 'Instructions to the model sit in the system message and grounding layer.' },
            { id: 'l4', text: 'Show a notice that answers are AI-generated and can be wrong' }
          ]
        },
        answer: { selected: ['l4'] } }
    ]
  },

  {
    id: 'ai900-dl-rai-7', cert: 'ai900', objective: '1.1', topic: 'Responsible generative AI',
    title: 'Sort mitigations into Microsoft\'s layers', estMinutes: 4,
    scenario: 'A team has collected mitigations for its generative AI app and needs to file each one under the right layer.',
    pair: 'Safety layers',
    family: 'Responsible AI principles',
    steps: [
      { id: 's1', type: 'categorize', points: 1,
        prompt: 'Sort each mitigation into its layer.',
        explanation: 'Model layer = which model you choose. Safety system = guardrails. System message and grounding = instructions and data in the prompt. User experience = how the app presents AI to people.',
        payload: {
          items: [
            { id: 'i1', label: 'Choose a model fine-tuned for safety' },
            { id: 'i2', label: 'Turn on guardrails for prompts and responses' },
            { id: 'i3', label: 'Tell the model to answer only from supplied documents' },
            { id: 'i4', label: 'Label answers as AI-generated with a feedback button' }
          ],
          buckets: [
            { id: 'k1', label: 'Model' },
            { id: 'k2', label: 'Safety system' },
            { id: 'k3', label: 'System message and grounding' },
            { id: 'k4', label: 'User experience' }
          ]
        },
        answer: { map: { i1: 'k1', i2: 'k2', i3: 'k3', i4: 'k4' } } }
    ]
  },

  {
    id: 'ai900-dl-app-12', cert: 'ai900', objective: '2.1', topic: 'Foundry SDK chat clients',
    title: 'Keep a key out of source code', estMinutes: 3,
    scenario: 'A Python app has its API key typed <mark>directly into the code</mark>, which is stored in a shared repository.',
    pair: 'Keys vs Identity',
    family: 'Generative AI apps & agents',
    steps: [
      { id: 's1', type: 'analyze', points: 1,
        prompt: 'Select the better practice.',
        explanation: 'The tell is a secret in source control. Load it from configuration such as environment variables or Key Vault, or use Microsoft Entra ID instead of keys.',
        payload: {
          multi: false,
          lines: [
            { id: 'l1', text: 'Encode it in Base64 in the code', why: 'Base64 is encoding, not protection, and it is still in the repository.' },
            { id: 'l2', text: 'Load it from configuration or use Entra ID' },
            { id: 'l3', text: 'Put it in the system message', why: 'Prompts are sent to the model and can be logged or echoed back, so they are no place for a secret.' },
            { id: 'l4', text: 'Move it to a config file committed to the repo', why: 'A committed config file is still in source control for anyone to read.' }
          ]
        },
        answer: { selected: ['l2'] } }
    ]
  },

  {
    id: 'ai900-dl-text-4', cert: 'ai900', objective: '2.2', topic: 'Azure Language',
    title: 'Separate opinions about different features', estMinutes: 3,
    scenario: 'A review says <mark>\'The battery life is poor but the screen is great\'</mark>, and the team wants separate sentiment for the battery and the screen.',
    pair: 'Sentiment vs Opinion mining',
    family: 'Azure Language features',
    steps: [
      { id: 's1', type: 'analyze', points: 1,
        prompt: 'Select the feature.',
        explanation: 'The tell is sentiment per aspect within one sentence. Opinion mining links each opinion to the thing it is about.',
        payload: {
          multi: false,
          lines: [
            { id: 'l1', text: 'Language detection', why: 'Language detection names the language.' },
            { id: 'l2', text: 'Key phrase extraction', why: 'Key phrases list topics without opinions.' },
            { id: 'l3', text: 'Opinion mining' },
            { id: 'l4', text: 'Summarization', why: 'Summarization shortens the text.' }
          ]
        },
        answer: { selected: ['l3'] } }
    ]
  },

  {
    id: 'ai900-dl-app-13', cert: 'ai900', objective: '2.1', topic: 'Agent tools',
    title: 'Match each need to the agent capability', estMinutes: 4,
    scenario: 'A team is configuring a Microsoft Foundry agent for its finance and support staff.',
    pair: 'Code interpreter vs File search',
    family: 'Agent tools',
    steps: [
      { id: 's1', type: 'match', points: 1,
        prompt: 'Match each need to the agent capability that handles it.',
        explanation: 'Calculations on files = code interpreter. Answers from your own uploaded documents = file search. Current public information = web search. What the agent must refuse = its instructions.',
        payload: {
          left: [
            { id: 'a1', label: 'Calculate totals and averages from an uploaded spreadsheet' },
            { id: 'a2', label: 'Answer questions from the company\'s uploaded PDF manuals' },
            { id: 'a3', label: 'Answer questions about today\'s public announcements' },
            { id: 'a4', label: 'Decline questions about colleagues\' salaries' }
          ],
          right: [
            { id: 'b2', label: 'File search' },
            { id: 'b4', label: 'The agent\'s instructions' },
            { id: 'b1', label: 'Code interpreter' },
            { id: 'b3', label: 'Web search' }
          ]
        },
        answer: { pairs: { a1: 'b1', a2: 'b2', a3: 'b3', a4: 'b4' } } }
    ]
  },

  {
    id: 'ai900-dl-speech-5', cert: 'ai900', objective: '2.2', topic: 'Azure Speech',
    title: 'Match each requirement to the Azure Speech capability', estMinutes: 4,
    scenario: 'A contact centre lists four speech requirements for its Azure Speech rollout.',
    pair: 'Batch vs Real-time',
    family: 'Azure Speech features',
    steps: [
      { id: 's1', type: 'match', points: 1,
        prompt: 'Match each requirement to the capability that meets it.',
        explanation: 'Stored files at volume = batch transcription. Pace, pauses and emphasis in spoken output = SSML. Who said what = speaker diarization. Spoken English shown as French text = speech translation.',
        payload: {
          left: [
            { id: 'a1', label: 'Transcribe thousands of stored recordings overnight' },
            { id: 'a2', label: 'Read balances aloud more slowly with pauses' },
            { id: 'a3', label: 'Label which person said each part of a meeting' },
            { id: 'a4', label: 'Show a presenter\'s English speech as French text' }
          ],
          right: [
            { id: 'b3', label: 'Speaker diarization' },
            { id: 'b1', label: 'Batch transcription' },
            { id: 'b4', label: 'Speech translation' },
            { id: 'b2', label: 'SSML (Speech Synthesis Markup Language)' }
          ]
        },
        answer: { pairs: { a1: 'b1', a2: 'b2', a3: 'b3', a4: 'b4' } } }
    ]
  },

  {
    id: 'ai900-dl-work-9', cert: 'ai900', objective: '1.3', topic: 'Text analysis',
    title: 'Match each request to the text analysis technique', estMinutes: 4,
    scenario: 'A media company has four requests for analysing its articles and reader comments.',
    pair: 'Entities vs Key phrases',
    family: 'Azure Language features',
    steps: [
      { id: 's1', type: 'match', points: 1,
        prompt: 'Match each request to the technique that fits.',
        explanation: 'Categorised people, companies and places = named entity recognition. Main talking points = key phrases. Personal data to hide = PII detection. Positive or negative tone = sentiment analysis.',
        payload: {
          left: [
            { id: 'a1', label: 'Tag each article with the people, companies and places it mentions' },
            { id: 'a2', label: 'List the main talking points in each reader review' },
            { id: 'a3', label: 'Hide phone numbers and emails before comments are published' },
            { id: 'a4', label: 'Flag comments with a negative tone for moderators' }
          ],
          right: [
            { id: 'b4', label: 'Sentiment analysis' },
            { id: 'b2', label: 'Key phrase extraction' },
            { id: 'b1', label: 'Named entity recognition' },
            { id: 'b3', label: 'PII detection' }
          ]
        },
        answer: { pairs: { a1: 'b1', a2: 'b2', a3: 'b3', a4: 'b4' } } }
    ]
  },

  {
    id: 'ai900-dl-vision-6', cert: 'ai900', objective: '2.3', topic: 'Visual input',
    title: 'Write alt text for product photos', estMinutes: 3,
    scenario: 'An online shop wants a <mark>one-sentence description of what each product photo shows</mark> to use as alt text.',
    pair: 'Multimodal vs OCR',
    family: 'Vision & image models',
    steps: [
      { id: 's1', type: 'analyze', points: 1,
        prompt: 'Select the approach.',
        explanation: 'The tell is a natural-language description of the whole scene. A multimodal model can look at the image and write the sentence.',
        payload: {
          multi: false,
          lines: [
            { id: 'l1', text: 'Run optical character recognition', why: 'OCR returns any text in the photo, not a description of what it shows.' },
            { id: 'l2', text: 'Ask a multimodal model to describe each photo' },
            { id: 'l3', text: 'Run object detection', why: 'Object detection returns boxes and labels, not a readable sentence.' },
            { id: 'l4', text: 'Generate a new image from the product name', why: 'Generating a new image does not describe the existing photo.' }
          ]
        },
        answer: { selected: ['l2'] } }
    ]
  },

  {
    id: 'ai900-dl-vision-7', cert: 'ai900', objective: '2.3', topic: 'Image generation',
    title: 'Get images that match the brand style', estMinutes: 3,
    scenario: 'Generated marketing images keep coming back in <mark>random styles that don\'t match the brand</mark>. The prompt is just \'a coffee cup\'.',
    pair: 'Prompt vs Size setting',
    family: 'Vision & image models',
    steps: [
      { id: 's1', type: 'analyze', points: 1,
        prompt: 'Select the most effective change.',
        explanation: 'The tell is a vague prompt producing off-brand results. Describing the style, subject, lighting and composition steers the model toward what the brand needs.',
        payload: {
          multi: false,
          lines: [
            { id: 'l1', text: 'Request a larger image size', why: 'A larger size gives more pixels but the same off-brand style.' },
            { id: 'l2', text: 'Generate more images per request', why: 'More images from the same vague prompt are just more random styles.' },
            { id: 'l3', text: 'Switch to an embeddings model', why: 'Embeddings models do not generate images.' },
            { id: 'l4', text: 'Describe the style, lighting and composition in the prompt' }
          ]
        },
        answer: { selected: ['l4'] } }
    ]
  }
];
