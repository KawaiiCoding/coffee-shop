/* =====================================================================
   SHARED STORY SCRIPT + TUTORIAL TEXT (read-only for agents).
   Main characters:
   - Mocha: a shy, kind brown bear (#d9a877). Lives alone in a tiny flat.
     Dreams of a bicycle so he can ride to visit his Mom in the hills.
   - Button: a lavender-grey cat (#b9b3c9), owner + barista of the café,
     cheerful, wears an apron with a green heart.
   - Mom: a soft cream bear with a flowery shawl and round glasses.
   ===================================================================== */
import type { HomeActionId, StoryId, StoryPanel, TutorialStepId } from './types';

export const STORIES: Record<StoryId, StoryPanel[]> = {
  intro: [
    { art: 'ad', speaker: 'Ad', text: '"Helper wanted on Yarn Street. Kind paws only."' },
    { art: 'walk_to_cafe', text: 'Mocha brushed his fur and off he went.' },
    { art: 'interview', speaker: 'Button', text: 'Do you like people... and coffee?' },
    { art: 'interview', speaker: 'Mocha', text: 'I love both! I carry trays very carefully!' },
    { art: 'hired', speaker: 'Button', text: 'You\'re hired! This apron is yours.' },
    { art: 'messy_shop', speaker: 'Button', text: 'Oops, it\'s a bit dusty. Help me tidy up?' },
  ],
  cleanup_done: [
    { art: 'shop_ready', speaker: 'Button', text: 'It sparkles! Let\'s open the door!' },
  ],
  payday: [
    { art: 'payday', speaker: 'Button', text: 'Great job! Here\'s your very first pay.' },
    { art: 'payday', speaker: 'Button', text: 'Tips buy café things. Pay is all yours!' },
  ],
  home_intro: [
    { art: 'home_evening', text: 'Home sweet home. Small, but his.' },
    { art: 'home_evening', speaker: 'Mocha', text: 'Maybe I can save for a bicycle to visit Mom!' },
  ],
  dream: [
    { art: 'dream_bike', text: 'Coin by coin... a shiny bicycle!' },
    { art: 'dream_bike', speaker: 'Mocha', text: 'Over the hills to Mom\'s house. Wheee!' },
    { art: 'dream_mom', speaker: 'Mom', text: 'My little Mocha! I\'m so proud of you.' },
  ],
  /* ---------- v3 chapter stories ---------- */
  phone_gift: [
    { art: 'phone_gift', speaker: 'Button', text: 'Five happy guests! Take my old phone.' },
    { art: 'phone_gift', speaker: 'Mocha', text: 'Now I can call Mom! Thank you!' },
  ],
  first_call: [
    { art: 'mom_call', speaker: 'Mom', text: 'Mocha? Is that you, sweetie?' },
    { art: 'mom_call', speaker: 'Mom', text: 'A café job! I\'m so proud of you.' },
  ],
  konbini_open: [
    { art: 'konbini_open', speaker: 'Button', text: 'Hoshi Mart just opened down the street!' },
    { art: 'konbini_open', text: 'Rice, eggs, snacks... a tiny shop of everything.' },
    { art: 'konbini_open', speaker: 'Mocha', text: 'Now I can cook real dinners!' },
  ],
  table_time: [
    { art: 'cooking_first', text: 'Three yummy meals, all by himself!' },
    { art: 'cooking_first', speaker: 'Button', text: 'A chef needs a table. Take my spare one!' },
  ],
  cozy_read: [
    { art: 'regular_gift', text: 'A squishy armchair, a good book...' },
    { art: 'home_evening', speaker: 'Mocha', text: 'The best seat in the whole world.' },
  ],
  star_wish: [
    { art: 'shooting_star', text: 'Whoosh! A star zipped past the window!' },
    { art: 'shooting_star', speaker: 'Mocha', text: 'I wish... everyone stays happy.' },
  ],
  fire_dream: [
    { art: 'new_dream', speaker: 'Mocha', text: 'I have my bicycle... what\'s next?' },
    { art: 'new_dream', speaker: 'Cotton', text: 'Winter is coming, dear. Stay warm!' },
    { art: 'new_dream', speaker: 'Mocha', text: 'New dream: a fireplace before the snow!' },
  ],
  fireplace: [
    { art: 'fireplace_night', text: 'Crackle, crackle. The fire glows warm.' },
    { art: 'fireplace_night', speaker: 'Mocha', text: 'Snow can come now. I\'m cozy.' },
  ],
  mom_dream: [
    { art: 'regular_gift', speaker: 'Crumb', text: 'Books need a home. Here, a bookshelf!' },
    { art: 'new_dream', speaker: 'Mocha', text: 'New dream: Mom visits my café!' },
  ],
  mom_visits_cafe: [
    { art: 'mom_visits_cafe', speaker: 'Mom', text: 'So this is your café! How lovely.' },
    { art: 'mom_visits_cafe', speaker: 'Button', text: 'Your Mocha is our best helper!' },
    { art: 'dream_mom', speaker: 'Mom', text: 'One cocoa, please, Waiter Mocha!' },
  ],
  party_dream: [
    { art: 'home_evening', text: 'Soft songs on the radio. So many friends now.' },
    { art: 'new_dream', speaker: 'Mocha', text: 'New dream: a party for my friends!' },
  ],
  friends_party: [
    { art: 'friends_party', text: 'Everyone squeezed into the tiny flat!' },
    { art: 'friends_party', speaker: 'Button', text: 'To Mocha, our favourite bear!' },
    { art: 'friends_party', speaker: 'Mocha', text: 'I\'m not shy with friends anymore.' },
  ],
  forever_cozy: [
    { art: 'home_evening', text: 'Sixty days of coffee, friends and honey toast.' },
    { art: 'shop_ready', speaker: 'Button', text: 'Same time tomorrow, partner?' },
    { art: 'new_dream', speaker: 'Mocha', text: 'Yes! And a new little dream.' },
  ],
};

/** Guided first customer. The UI shows these as a checklist; the current step's `how` is the explanation. */
export const TUTORIAL_STEPS: { id: TutorialStepId; title: string; how: string }[] = [
  { id: 'seat', title: 'Seat the guest', how: 'Tap the guest at the door, then tap a free table.' },
  { id: 'take', title: 'Take the order', how: 'When a cup appears in their bubble, tap their table.' },
  { id: 'pickup', title: 'Pick up the drink', how: 'Button makes it. When it\'s on the counter, tap the counter.' },
  { id: 'serve', title: 'Serve it', how: 'Tap the guest\'s table to bring the drink.' },
  { id: 'collect', title: 'Collect the tip', how: 'Tap the coins on the table. Happy guests tip more!' },
];

/** Cleanup checklist labels (UI). */
export const CHORE_LABELS: Record<string, string> = {
  dust: 'Sweep the dust bunnies',
  cobweb: 'Clear the cobwebs',
  box: 'Move the boxes',
  spill: 'Mop the spill',
  place_table: 'Set up the tables',
  place_decor: 'Hang bunting and set up the record player',
};

/** Short lines Mom says on the phone (one per call, cycles). */
export const MOM_LINES = [
  'Are you eating well, sweetie?',
  'I knitted you new mittens! They\'re in the post.',
  'Your old room still smells like honey cake.',
  'I\'m so proud of my working bear!',
  'Don\'t forget to rest your paws.',
];

/** Where the bear stands to do each home action (scene coords) — see HOME_SPOTS in layout.ts. */
export type { HomeActionId };
