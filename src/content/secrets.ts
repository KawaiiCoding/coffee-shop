/* MOCHA'S JOURNAL SECRETS — 36 hidden discoveries, one per sticker. Ordered roughly easiest first. */
import type { SecretDef } from '../types';

export const SECRETS: SecretDef[] = [
  /* ---------- easy: a curious paw finds these on day one ---------- */
  {
    id: 'door_bell', title: 'Ding-a-ling Hello', sticker: 'bell_ring',
    trigger: { kind: 'tap', spot: 'cafe_door_bell', times: 3 },
    page: 'I rang the door bell three times and Button popped out like a guest had come. It was only me. He sighed, but he smiled under his whiskers.',
    hint: 'Somebody is always waiting by the door...',
  },
  {
    id: 'kettle_song', title: 'The Singing Kettle', sticker: 'kettle_song',
    trigger: { kind: 'tap', spot: 'home_kettle', times: 3 },
    page: 'My kettle whistles a little tune if you pat it nicely. I think it knows the lullaby Mom used to hum. We sang a duet. The kettle won.',
    hint: 'Some kitchen things love a little pat.',
  },
  {
    id: 'duck_sign', title: 'Quack Means Welcome', sticker: 'duck_quack',
    trigger: { kind: 'tap', spot: 'home_duck_sign', times: 1 },
    page: 'The duck sign by my door went QUACK! I jumped so high my slippers flew off. I am going to tell Pip his cousin lives here now.',
    hint: 'That little sign by the door has a voice.',
  },
  {
    id: 'menu_doodle', title: 'Secret Menu Art', sticker: 'menu_doodle',
    trigger: { kind: 'tap', spot: 'cafe_menu_board', times: 3 },
    page: 'Someone drew a tiny bear with a latte in the corner of the menu board. It has my ears! I added a heart next to it. Shh.',
    hint: 'Read the menu board very, very closely.',
  },
  {
    id: 'button_paw', title: 'Partner Paw-Shake', sticker: 'button_paw',
    trigger: { kind: 'tap', spot: 'cafe_barista', times: 5 },
    page: 'I kept poking Button until he gave me a paw-shake. His paw pads are so squishy. He says partners only do this once a year, but he did it twice.',
    hint: 'The boss is softer than he looks...',
    reward: { kind: 'decor', id: 'cat_bed' },
  },
  {
    id: 'plant_sprout', title: 'A Brand New Leaf', sticker: 'plant_sprout',
    trigger: { kind: 'tap', spot: 'cafe_plant', times: 5 },
    page: 'I talked to the café plant all morning and a tiny new leaf uncurled! I named it Latte. Fern says plants love gossip.',
    hint: 'Plants grow faster when you chat to them.',
  },
  {
    id: 'moving_box', title: 'Who Is In The Box?', sticker: 'box_cat',
    trigger: { kind: 'tap', spot: 'home_box', times: 3 },
    page: 'My last moving box wiggled! Inside was a stray paper cat Mom folded and packed as a surprise. It says "Be brave, little bean."',
    hint: 'Not everything got unpacked yet...',
  },
  {
    id: 'record_note', title: 'DJ Mocha', sticker: 'record_note',
    trigger: { kind: 'event', event: 'record_toggle', times: 3 },
    page: 'Music on, music off, music on! Every guest did a little head bob each time. I think I have found my true calling. Button disagrees.',
    hint: 'The record player likes to be fiddled with.',
  },
  {
    id: 'clerk_bow', title: 'The Politest Bow', sticker: 'clerk_bow',
    trigger: { kind: 'tap', spot: 'konbini_clerk', times: 3 },
    page: 'I bowed to the Hoshi Mart clerk, then they bowed back, then I bowed again... We did eleven bows. My neck is tired but my heart is full.',
    hint: 'Good manners at Hoshi Mart are returned.',
  },
  {
    id: 'snack_sale', title: 'Bargain Bear', sticker: 'snack_bag',
    trigger: { kind: 'event', event: 'bought_sale_item', times: 1 },
    page: 'The Gazette said there was a sale and I raced to Hoshi Mart in my pyjama top. Saving money tastes even better than melon bread. Almost.',
    hint: 'The morning paper knows about bargains.',
  },
  {
    id: 'pillow_fort', title: 'Fort Fluffington', sticker: 'pillow_fort',
    trigger: { kind: 'tap', spot: 'home_pillow', times: 5 },
    page: 'I fluffed my pillow so much it became a fort. Population: one bear. Rules: no worries allowed, snacks are mandatory.',
    hint: 'A pillow can be so much more than a pillow.',
    reward: { kind: 'homeItem', id: 'rug_round' },
  },

  /* ---------- medium: a few days of cozy living ---------- */
  {
    id: 'umbrella_frog', title: 'The Umbrella Stowaway', sticker: 'umbrella_frog',
    trigger: { kind: 'tap', spot: 'konbini_umbrella', times: 3, when: { season: 'spring' } },
    page: 'A tiny frog was napping in the umbrella stand, waiting out the spring showers. He said ribbit, which I think means rent-free.',
    hint: 'Spring showers bring umbrella visitors.',
  },
  {
    id: 'rainy_window', title: 'Raindrop Races', sticker: 'rainy_window',
    trigger: { kind: 'tap', spot: 'cafe_window', times: 5, when: { season: 'autumn' } },
    page: 'I picked a raindrop on the café window and cheered it down the glass. Cotton picked one too. Mine won, but hers was knitting the whole way.',
    hint: 'Autumn windows are a racetrack...',
  },
  {
    id: 'coffee_machine', title: 'Shop Coffee Spy', sticker: 'coffee_cup',
    trigger: { kind: 'tap', spot: 'konbini_coffee_machine', times: 5 },
    page: 'I inspected the Hoshi Mart coffee machine very seriously. It goes "brrrr-pssh". Mine goes "brrr-PSSH". Ours is better. I am not biased.',
    hint: 'Know your rival, little barista.',
  },
  {
    id: 'jar_sparkle', title: 'The Jar Twinkles', sticker: 'jar_sparkle',
    trigger: { kind: 'tap', spot: 'home_jar', times: 7, when: { minDay: 5 } },
    page: 'If you shake the savings jar just right, the coins sparkle like a tiny galaxy. I promised it I would not spend the stars. Only some.',
    hint: 'Shake your dreams gently. They jingle.',
    reward: { kind: 'pay', amount: 10 },
  },
  {
    id: 'early_bird', title: 'Sunrise Shift', sticker: 'early_bird',
    trigger: { kind: 'event', event: 'early_bird', times: 1 },
    page: 'I was up before the sun! The street was pink and quiet, and a sparrow and I shared a crumb of toast. Being early feels like a secret.',
    hint: 'The world is very pink before breakfast.',
  },
  {
    id: 'night_owl', title: 'After Midnight', sticker: 'night_owl',
    trigger: { kind: 'event', event: 'night_owl', times: 1 },
    page: 'It is way past bedtime and I am still awake. An owl outside said "hoo", and I said "me". We are friends now. Please do not tell Mom.',
    hint: 'Who is still awake when the clock says 12?',
  },
  {
    id: 'moon_smile', title: 'The Moon Smiled Back', sticker: 'moon_smile',
    trigger: { kind: 'tap', spot: 'home_moon', times: 3, when: { hourFrom: 20, hourTo: 5 } },
    page: 'The moon looked lonely, so I waved three times. It smiled back! I am almost sure. I left a cookie on the windowsill, just in case.',
    hint: 'The moon looks lonely tonight...',
    reward: { kind: 'happiness', amount: 10 },
  },
  {
    id: 'star_sign', title: 'Wish Upon A Sign', sticker: 'konbini_star',
    trigger: { kind: 'tap', spot: 'konbini_star_sign', times: 7, when: { hourFrom: 18, hourTo: 6 } },
    page: 'The big star on the Hoshi Mart sign blinks when you tap it after dark. "Hoshi" means star! I made a small wish. It was about pudding.',
    hint: 'Some shop signs shine brighter after dark.',
  },
  {
    id: 'perfect_day', title: 'A Perfect Day', sticker: 'perfect_day',
    trigger: { kind: 'event', event: 'day_three_stars', times: 1 },
    page: 'Three whole stars! Nobody waited, nothing spilled, and Button did a tiny happy spin when he thought I was not looking. I saw. I saw everything.',
    hint: 'Shine bright, all day long.',
    reward: { kind: 'tips', amount: 15 },
  },
  {
    id: 'big_basket', title: 'The Heavy Basket', sticker: 'big_basket',
    trigger: { kind: 'event', event: 'konbini_big_basket', times: 1 },
    page: 'I filled my basket so full I had to carry it with both paws and my tummy. The clerk clapped. I walked home like a very proud turtle.',
    hint: 'Shopping is a sport if you try hard enough.',
  },
  {
    id: 'newspaper_fan', title: 'Gazette Gossip', sticker: 'book_stack',
    trigger: { kind: 'event', event: 'read_newspaper', times: 7 },
    page: 'Seven mornings of the Yarn Street Gazette! I now know every bit of town news, and that Pip lost a sock again. I am basically a reporter.',
    hint: 'Good news arrives every morning.',
  },
  {
    id: 'cat_clock', title: 'The Winking Clock', sticker: 'clock_wink',
    trigger: { kind: 'tap', spot: 'cafe_clock', times: 5, when: { chapterAtLeast: 15 } },
    page: 'Crumb\'s cat clock winked at me! Its tail swished like it was sharing a joke. Crumb says it is not scary. Crumb is hiding behind a book.',
    hint: 'A clock with whiskers keeps more than time.',
  },
  {
    id: 'sunny_regulars', title: 'Sunshine Faces', sticker: 'sunflower',
    trigger: { kind: 'event', event: 'served_regular', times: 10 },
    page: 'Ten cups for my regular friends! Seeing a familiar face at the door is like a sunflower turning to the sun. I am the sun. Or the flower. Both!',
    hint: 'Familiar faces make the café bloom.',
  },
  {
    id: 'mom_calls', title: 'Phone Full Of Love', sticker: 'phone_heart',
    trigger: { kind: 'event', event: 'called_mom', times: 10 },
    page: 'Ten calls with Mom! She still asks if I eat my veggies. I still say "mostly". Hearing her laugh makes my little home feel bigger.',
    hint: 'Someone far away loves to hear your voice.',
  },
  {
    id: 'bath_autumn', title: 'Bubbles And Rain', sticker: 'bubble_bath',
    trigger: { kind: 'event', event: 'bath', times: 3, when: { season: 'autumn' } },
    page: 'The autumn rain went pitter-pat on the roof while I made a bubble beard in the bath. I looked very wise. Then I sneezed it all off.',
    hint: 'Autumn evenings were made for bubbles.',
  },
  {
    id: 'mom_photo', title: 'Mom Is Watching', sticker: 'mom_photo',
    trigger: { kind: 'tap', spot: 'home_photo', times: 3, when: { hourFrom: 21, hourTo: 4 } },
    page: 'I said goodnight to Mom\'s photo and I could almost hear her say "sleep tight, little bean". I kissed the frame. It is a bit smudgy now.',
    hint: 'Say goodnight to someone on the wall.',
  },

  /* ---------- harder: seasons, fires and big milestones ---------- */
  {
    id: 'pumpkin_festival', title: 'Spooky Little Me', sticker: 'pumpkin_grin',
    trigger: { kind: 'event', event: 'festival_day', times: 1, when: { festivalToday: 'halloween' } },
    page: 'On Halloween a tiny ghost ordered a pumpkin latte and paid in candy corn. Button accepted it! I wore a sheet with eye holes. Boo, please.',
    hint: 'Pumpkins grin wider on one special night.',
    reward: { kind: 'tips', amount: 20 },
  },
  {
    id: 'fire_heart', title: 'Crackle And Glow', sticker: 'fire_heart',
    trigger: { kind: 'tap', spot: 'home_fireplace', times: 3, when: { fireOn: true } },
    page: 'If you watch the fire long enough, a spark jumps up shaped like a heart. I watched it three times to be sure. My toes are toasty pink.',
    hint: 'Look closely when the fire is crackling.',
  },
  {
    id: 'snow_warm', title: 'Snowy Toes, Warm Heart', sticker: 'snowflake',
    trigger: { kind: 'event', event: 'warmed', times: 5, when: { season: 'winter' } },
    page: 'Five winter nights by the fire. A snowflake stuck to my nose on the way home and I carried it inside to meet the stove. It did not survive.',
    hint: 'Winter is best spent by something warm.',
  },
  {
    id: 'sleepy_moon', title: 'Two Weeks Of Dreams', sticker: 'sleepy_moon',
    trigger: { kind: 'event', event: 'slept', times: 14 },
    page: 'Fourteen nights in my new bed. Last night I dreamed of a cake as big as the café, and Pip was the candle. He looked very happy about it.',
    hint: 'Good things come to bears who rest.',
  },
  {
    id: 'grand_upgrade', title: 'Lanterns For A Big Café', sticker: 'festival_lantern',
    trigger: { kind: 'event', event: 'bought_upgrade', times: 5 },
    page: 'Five upgrades! Button lit a paper lantern and gave a speech about "our humble beginnings". It was two minutes long. He cried a tiny bit.',
    hint: 'Keep making the café better and better...',
    reward: { kind: 'pay', amount: 25 },
  },
  {
    id: 'christmas_wish', title: 'A Christmas Star', sticker: 'star_wish',
    trigger: { kind: 'event', event: 'wish', times: 1, when: { theme: 'christmas' } },
    page: 'I caught a shooting star at Christmas time! I wished for snow on the café roof and warm paws for everyone. And maybe a sled. A small one.',
    hint: 'Stars fall differently when the lights twinkle.',
  },
  {
    id: 'rich_wallet', title: 'Coins Coins Coins', sticker: 'golden_coin',
    trigger: { kind: 'event', event: 'rich_wallet', times: 1 },
    page: 'My wallet is so heavy it goes clink when I walk! I counted my coins twice and stacked them into a tower. Then I sneezed. Counted them again.',
    hint: 'A bear with a heavy wallet walks funny.',
  },
  {
    id: 'all_friends', title: 'My Whole Circle', sticker: 'friend_circle',
    trigger: { kind: 'event', event: 'all_regulars_met', times: 1 },
    page: 'Maple, Cotton, Fern, Pip, Crumb and Pom. I came here knowing nobody, and now my café is full of friends. I wrote all their names in pen.',
    hint: 'Every regular has a seat waiting for them.',
    reward: { kind: 'happiness', amount: 20 },
  },
  {
    id: 'master_chef', title: 'Chef Mocha', sticker: 'chef_hat',
    trigger: { kind: 'event', event: 'cooked_all_recipes', times: 1 },
    page: 'I have cooked every single recipe in my book! I made myself a paper chef hat. It is too tall and keeps bumping the lamp. I am keeping it.',
    hint: 'Every recipe deserves at least one try.',
  },
];
