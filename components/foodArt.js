// Painted food (tools/art/food.py), picked from the dish's name: "Spicy Ramen Bowl" gets the ramen,
// "Chicken Tikka Masala" the curry. Anything the rules don't know falls back to the old cut-outs.
import React from 'react';
import { Image } from 'react-native';
import { Sticker } from './art';

const FOOD = {
  ramen: require('../assets/art/food/ramen.webp'),
  soup: require('../assets/art/food/soup.webp'),
  curry: require('../assets/art/food/curry.webp'),
  ricebowl: require('../assets/art/food/ricebowl.webp'),
  pizza: require('../assets/art/food/pizza.webp'),
  burger: require('../assets/art/food/burger.webp'),
  sandwich: require('../assets/art/food/sandwich.webp'),
  burrito: require('../assets/art/food/burrito.webp'),
  taco: require('../assets/art/food/taco.webp'),
  salad: require('../assets/art/food/salad.webp'),
  fries: require('../assets/art/food/fries.webp'),
  pasta: require('../assets/art/food/pasta.webp'),
  sushi: require('../assets/art/food/sushi.webp'),
  dumplings: require('../assets/art/food/dumplings.webp'),
  chicken: require('../assets/art/food/chicken.webp'),
  hotdog: require('../assets/art/food/hotdog.webp'),
  fish: require('../assets/art/food/fish.webp'),
  plate: require('../assets/art/food/plate.webp'),
  steak: require('../assets/art/food/steak.webp'),
  cookie: require('../assets/art/food/cookie.webp'),
  donut: require('../assets/art/food/donut.webp'),
  croissant: require('../assets/art/food/croissant.webp'),
  bread: require('../assets/art/food/bread.webp'),
  pancakes: require('../assets/art/food/pancakes.webp'),
  breakfast: require('../assets/art/food/breakfast.webp'),
  cake: require('../assets/art/food/cake.webp'),
  icecream: require('../assets/art/food/icecream.webp'),
  coffee: require('../assets/art/food/coffee.webp'),
  drink: require('../assets/art/food/drink.webp'),
  seafood: require('../assets/art/food/seafood.webp'),
};

// first match wins, so the specific ones come first ("breakfast burrito" is a burrito, "ice cream sandwich" is ice cream)
const RULES = [
  ['curry', /curry|tikka|masala|korma|\bdal\b|vindaloo|biryani|rama\b/],
  ['ramen', /ramen|\bpho\b|udon|soba|noodle soup/],
  ['soup', /soup|chowder|\bchili\b(?! dog)|stew|bisque|borscht|gumbo/],
  ['icecream', /ice cream|gelato|sundae|froyo|frozen yogurt|shake|soft serve|float/],
  ['burrito', /burrito|wrap|quesadilla|enchilada/],
  ['taco', /taco|nacho|guac|arepa|tostada/],
  ['pizza', /pizza|slice|calzone|flatbread|margherita|stromboli/],
  ['burger', /burger|slider|double-double|cheeseburger/],
  ['hotdog', /hot ?dog|chili dog|bratwurst|sausage|\bbrat\b/],
  ['pancakes', /pancake|waffle|french toast|crepe/],
  ['sandwich', /sandwich|\bsub\b|panini|hoagie|\bblt\b|club|melt|grilled cheese|bacon egg/],
  ['salad', /salad|greens|slaw|burrata/],
  ['sushi', /sushi|maki|nigiri|\bpoke\b|sashimi|\broll\b/],
  ['dumplings', /dumpling|gyoza|\bbao\b|potsticker|momo|xiao long|wonton|pierogi|samosa|empanada|pupusa|spanakopita/],
  [
    'pasta',
    /pasta|spaghetti|mac & cheese|mac and cheese|penne|lasagna|alfredo|cacio|carbonara|noodle|pad thai|pad see ew|lo mein|ravioli|gnocchi|risotto/,
  ],
  ['plate', /shawarma|falafel|hummus|souvlaki|kebab|kabob|gyro|plate|platter|tasting menu/],
  ['fries', /fries|\btots\b|onion rings|poutine|potato|bravas/],
  ['seafood', /shrimp|prawn|crab|lobster|clam|oyster|mussel|scallop|calamari|octopus/],
  ['fish', /fish|salmon|\bcod\b|tuna|trout/],
  ['ricebowl', /fried rice|bibimbap|bowl|\brice\b|stir ?fry|teriyaki|paella|tofu/],
  ['steak', /steak|ribeye|brisket|\bribs\b|bbq|pork chop|lamb|beef/],
  ['chicken', /chicken|wings|tenders|nugget|karaage|yakitori|drumstick/],
  ['breakfast', /\begg|omelet|bacon|hash brown|breakfast|benedict|scramble/],
  ['croissant', /croissant|pastry|danish|morning bun|muffin|scone|churro|galette|strudel/],
  ['donut', /donut|doughnut|beignet|cruller/],
  ['cookie', /cookie|brownie|biscotti/],
  ['cake', /cake|\bpie\b|tart|cupcake|tiramisu|pudding|cobbler|br[uû]l[eé]e|custard|flan/],
  ['bread', /bread|knots|naan|pretzel|bagel|toast|focaccia|biscuit|\bbun\b/],
  ['coffee', /coffee|latte|espresso|cappuccino|mocha|americano|cold brew|matcha/],
  ['drink', /\btea\b|boba|smoothie|juice|lemonade|soda|drink|horchata|agua/],
];

// the old cut-outs, by tag, for dishes the name rules don't cover
const TAG_ART = {
  sweet: 'lemonSlice',
  spicy: 'bloodOrange',
  protein: 'sardine',
  healthy: 'lemon',
  cozy: 'vase',
  value: 'orangeSlice',
};
export const artForDish = (dish) => TAG_ART[dish.tags?.find((t) => TAG_ART[t])] || 'goldfish';

export function foodFor(dish) {
  const name = String(dish?.name || dish?.dishName || '').toLowerCase();
  return RULES.find(([, re]) => re.test(name))?.[0] || null;
}

// square painting of the dish, or one of the old cut-outs when it's something the rules don't cover
export default function FoodArt({ dish, width = 120, rotate = 0, style }) {
  const key = foodFor(dish);
  if (!key) {
    const art = artForDish(dish || {});
    return <Sticker name={art} width={art === 'sardine' ? width * 1.5 : width * 0.8} rotate={rotate} style={style} />;
  }
  return (
    <Image
      source={FOOD[key]}
      style={[{ width, height: width, transform: [{ rotate: `${rotate}deg` }] }, style]}
      resizeMode="contain"
    />
  );
}
