// Keeps the tour, the caption card and the phone in sync.
// The app (inside the iframe) posts { source: 'apero', screen } whenever you move around,
// and listens for { source: 'apero-site', go } to jump to a step.

const CAPTIONS = {
  Onboarding: {
    step: 'school',
    art: 'stamp',
    title: 'Pick your school',
    body: 'Start the way a new student would. Choose a campus and how you get around, and the demo fills in classmates, menus and deals for it.',
    try: 'Try: pick a school, then tap Let’s eat.',
  },
  Today: {
    step: 'today',
    art: 'goldfish',
    title: 'Today',
    body: 'The best rated dishes on your campus, what’s on the menu right now, deals that are on today and where people are eating.',
    try: 'Try: tap a mood, or the top dish.',
  },
  Explore: {
    step: 'explore',
    art: 'shell',
    title: 'Explore',
    body: 'Dining halls and cheap eats near campus, scored by everyone who’s eaten there. Worldwide shows the best places on every campus.',
    try: 'Try: Cheap eats, then sort by Cheapest all in.',
  },
  Place: {
    step: 'explore',
    art: 'lemon',
    title: 'A place',
    body: 'Everyone’s rating and how the votes split, a map, directions for how you get around, what the trip costs, deals and reviews.',
    try: 'Try: scroll down to the menu.',
  },
  Dish: {
    step: 'explore',
    art: 'burst',
    title: 'A dish',
    body: 'The campus score, your own score, which friends have had it and what people said.',
    try: 'Try: Rate this dish.',
  },
  PickDish: {
    step: 'rate',
    art: 'matchbox',
    title: 'Rate a dish',
    body: 'Find what you ate, or add it if it’s new. Everything you rate goes into your own ranked list.',
    try: 'Try: tap any dish.',
  },
  WriteReview: {
    step: 'rate',
    art: 'matchbox',
    title: 'The verdict',
    body: 'Loved it, fine, or not for me, plus why. Then a couple of quick questions to place it in your list.',
    try: 'Try: pick a verdict and tap Next.',
  },
  Compare: {
    step: 'rate',
    art: 'matchbox',
    title: 'This or that',
    body: 'Each answer halves where the new dish can go, so your list stays in order with two or three taps.',
    try: 'Try: pick the one you liked more.',
  },
  MyList: {
    step: 'rate',
    art: 'stamp',
    title: 'My list',
    body: 'Everything you’ve rated, best at the top. Scores are yours alone.',
    try: '',
  },
  Friends: {
    step: 'friends',
    art: 'goldfish',
    title: 'Friends',
    body: 'Add people by handle or find classmates. Friends are sorted by taste match, worked out from the dishes you’ve both ranked.',
    try: 'Try: open the friend at the top.',
  },
  Friend: {
    step: 'friends',
    art: 'shell',
    title: 'Taste match',
    body: 'How closely you two agree, what you both loved, and what they loved that you haven’t tried yet.',
    try: '',
  },
  Decider: {
    step: 'decider',
    art: 'lemon',
    title: 'Group decider',
    body: 'Pick who’s coming and a budget. It ranks places for the whole group, then you can spin the orange to settle it.',
    try: 'Try: add two friends, tap Find our spot, then spin.',
  },
  Deals: {
    step: 'deals',
    art: 'burst',
    title: 'Deals',
    body: 'Student discounts and specials posted by students. Tap Still good after you use one so people know it’s real.',
    try: 'Try: post a deal.',
  },
  AddDeal: {
    step: 'deals',
    art: 'burst',
    title: 'Post a deal',
    body: 'Where, what, which days, and when it ends.',
    try: '',
  },
  Wrapped: {
    step: 'wrapped',
    art: 'stamp',
    title: 'Campus Wrapped',
    body: 'Your semester in food: how much you rated, your number one, your spot, your eater type and your taste twin.',
    try: 'Try: tap the right side to flip through.',
  },
  Feed: {
    step: 'today',
    art: 'goldfish',
    title: 'Feed',
    body: 'What everyone at your school, or just your friends, has been rating.',
    try: '',
  },
  Profile: {
    step: 'friends',
    art: 'shell',
    title: 'You',
    body: 'Your stats, your taste, friends, Wrapped and settings.',
    try: '',
  },
  Mood: {
    step: 'today',
    art: 'lemon',
    title: 'By mood',
    body: 'Cozy, fresh, spicy, cheap and filling: dishes tagged for what you feel like.',
    try: '',
  },
};

const frame = document.getElementById('app');
const buttons = [...document.querySelectorAll('[data-step]')];
let current = 'Onboarding';

function show(screen) {
  const caption = CAPTIONS[screen];
  if (!caption) return;
  current = screen;
  document.getElementById('caption-title').textContent = caption.title;
  document.getElementById('caption-body').textContent = caption.body;
  document.getElementById('caption-try').textContent = caption.try;
  document.getElementById('caption-art').src = `img/${caption.art}.png`;
  buttons.forEach((b) => b.classList.toggle('on', b.dataset.step === caption.step));
}

window.addEventListener('message', (event) => {
  if (event.source === frame.contentWindow && event.data?.source === 'apero') show(event.data.screen);
});

buttons.forEach((button) =>
  button.addEventListener('click', () => {
    const step = button.dataset.step;
    if (step === 'school' || current === 'Onboarding') {
      // starting over (or haven't picked a school yet): reload the demo at the school picker
      if (step === 'school') frame.src = 'app/?demo=1';
      return;
    }
    frame.contentWindow.postMessage({ source: 'apero-site', go: step }, '*');
  }),
);

// scale the phone to fit the window height
function fit() {
  const scale = Math.min(1, (window.innerHeight - 70) / 868);
  document.documentElement.style.setProperty('--phone-scale', scale.toFixed(3));
}
window.addEventListener('resize', fit);
fit();
show('Onboarding');
