// FLAG TRIVIA
// Paste this entire script into sketch.js in the p5.js editor.
// No additional libraries or image uploads needed.

// Format: flag code | country name | optional accepted alternatives
const COUNTRY_DATA = `
af|Afghanistan
al|Albania
dz|Algeria
ad|Andorra
ao|Angola
ag|Antigua and Barbuda|Antigua & Barbuda
ar|Argentina
am|Armenia
au|Australia
at|Austria
az|Azerbaijan
bs|Bahamas|The Bahamas
bh|Bahrain
bd|Bangladesh
bb|Barbados
by|Belarus
be|Belgium
bz|Belize
bj|Benin
bt|Bhutan
bo|Bolivia
ba|Bosnia and Herzegovina|Bosnia|Bosnia & Herzegovina
bw|Botswana
br|Brazil
bn|Brunei|Brunei Darussalam
bg|Bulgaria
bf|Burkina Faso
bi|Burundi
cv|Cabo Verde|Cape Verde
kh|Cambodia
cm|Cameroon
ca|Canada
cf|Central African Republic|CAR
td|Chad
cl|Chile
cn|China|People's Republic of China|PRC
co|Colombia
km|Comoros
cg|Republic of the Congo|Congo Republic|Congo Brazzaville
cd|Democratic Republic of the Congo|DR Congo|DRC|Congo Kinshasa
cr|Costa Rica
ci|Côte d'Ivoire|Ivory Coast|Cote d Ivoire
hr|Croatia
cu|Cuba
cy|Cyprus
cz|Czechia|Czech Republic
dk|Denmark
dj|Djibouti
dm|Dominica
do|Dominican Republic
ec|Ecuador
eg|Egypt
sv|El Salvador
gq|Equatorial Guinea
er|Eritrea
ee|Estonia
sz|Eswatini|Swaziland
et|Ethiopia
fj|Fiji
fi|Finland
fr|France
ga|Gabon
gm|Gambia|The Gambia
ge|Georgia
de|Germany
gh|Ghana
gr|Greece
gd|Grenada
gt|Guatemala
gn|Guinea
gw|Guinea-Bissau|Guinea Bissau
gy|Guyana
ht|Haiti
hn|Honduras
hu|Hungary
is|Iceland
in|India
id|Indonesia
ir|Iran
iq|Iraq
ie|Ireland|Republic of Ireland
il|Israel
it|Italy
jm|Jamaica
jp|Japan
jo|Jordan
kz|Kazakhstan
ke|Kenya
ki|Kiribati
kp|North Korea|DPRK|Democratic People's Republic of Korea
kr|South Korea|Republic of Korea
kw|Kuwait
kg|Kyrgyzstan
la|Laos|Lao PDR
lv|Latvia
lb|Lebanon
ls|Lesotho
lr|Liberia
ly|Libya
li|Liechtenstein
lt|Lithuania
lu|Luxembourg
mg|Madagascar
mw|Malawi
my|Malaysia
mv|Maldives
ml|Mali
mt|Malta
mh|Marshall Islands
mr|Mauritania
mu|Mauritius
mx|Mexico
fm|Micronesia|Federated States of Micronesia
md|Moldova
mc|Monaco
mn|Mongolia
me|Montenegro
ma|Morocco
mz|Mozambique
mm|Myanmar|Burma
na|Namibia
nr|Nauru
np|Nepal
nl|Netherlands|The Netherlands
nz|New Zealand
ni|Nicaragua
ne|Niger
ng|Nigeria
mk|North Macedonia|Macedonia
no|Norway
om|Oman
pk|Pakistan
pw|Palau
pa|Panama
pg|Papua New Guinea|PNG
py|Paraguay
pe|Peru
ph|Philippines|The Philippines
pl|Poland
pt|Portugal
qa|Qatar
ro|Romania
ru|Russia|Russian Federation
rw|Rwanda
kn|Saint Kitts and Nevis|St Kitts and Nevis
lc|Saint Lucia|St Lucia
vc|Saint Vincent and the Grenadines|St Vincent and the Grenadines
ws|Samoa
sm|San Marino
st|São Tomé and Príncipe|Sao Tome and Principe
sa|Saudi Arabia
sn|Senegal
rs|Serbia
sc|Seychelles
sl|Sierra Leone
sg|Singapore
sk|Slovakia
si|Slovenia
sb|Solomon Islands
so|Somalia
za|South Africa
ss|South Sudan
es|Spain
lk|Sri Lanka
sd|Sudan
sr|Suriname
se|Sweden
ch|Switzerland
sy|Syria
tj|Tajikistan
tz|Tanzania
th|Thailand
tl|Timor-Leste|East Timor|Timor Leste
tg|Togo
to|Tonga
tt|Trinidad and Tobago|Trinidad & Tobago
tn|Tunisia
tr|Türkiye|Turkey|Turkiye
tm|Turkmenistan
tv|Tuvalu
ug|Uganda
ua|Ukraine
ae|United Arab Emirates|UAE
gb|United Kingdom|UK|Great Britain|Britain
us|United States|USA|US|United States of America|America
uy|Uruguay
uz|Uzbekistan
vu|Vanuatu
va|Vatican City|Vatican|Holy See
ve|Venezuela
vn|Vietnam|Viet Nam
ye|Yemen
zm|Zambia
zw|Zimbabwe
ps|Palestine|State of Palestine
tw|Taiwan|Republic of China
`;

const countries = COUNTRY_DATA.trim().split("\n").map(line => {
  const [code, name, ...aliases] = line.trim().split("|");
  return { code, name, aliases };
});

let deck = [];
let current = null;
let flagImage = null;

let loading = false;
let imageFailed = false;
let answered = false;
let finished = false;

let score = 0;
let attempts = 0;
let streak = 0;
let bestStreak = 0;

let feedback = "";
let feedbackColor = "#dce6ff";

let root;
let guessInput;
let guessButton;
let revealButton;
let nextButton;
let restartButton;

// Prevent an older image request from replacing a newer flag.
let imageRequestId = 0;

function setup() {
  root = createDiv();
  root.style("max-width", "720px");
  root.style("margin", "20px auto");
  root.style("font-family", "Arial, sans-serif");

  const canvas = createCanvas(720, 520);
  canvas.parent(root);
  canvas.style("display", "block");
  canvas.style("width", "100%");
  canvas.style("height", "auto");
  canvas.attribute("aria-label", "Flag trivia game");

  const controls = createDiv();
  controls.parent(root);
  controls.style("background", "#17243d");
  controls.style("padding", "18px");
  controls.style("border-radius", "0 0 16px 16px");
  controls.style("display", "flex");
  controls.style("flex-wrap", "wrap");
  controls.style("gap", "10px");

  guessInput = createInput("");
  guessInput.parent(controls);
  guessInput.attribute("placeholder", "Type the country or nation...");
  guessInput.attribute("aria-label", "Your country guess");
  guessInput.attribute("autocomplete", "off");
  guessInput.style("flex", "1 1 100%");
  guessInput.style("min-width", "0");
  guessInput.style("padding", "13px");
  guessInput.style("font-size", "18px");
  guessInput.style("border", "2px solid #52678f");
  guessInput.style("border-radius", "8px");
  guessInput.style("box-sizing", "border-box");

  guessInput.elt.addEventListener("keydown", event => {
    if (event.key === "Enter") {
      event.preventDefault();
      submitGuess();
    }
  });

  guessButton = makeButton("Guess", controls, submitGuess, "#2563eb");
  revealButton = makeButton(
    "Reveal answer",
    controls,
    revealAnswer,
    "#475569"
  );
  nextButton = makeButton("Next flag →", controls, nextFlag, "#15803d");
  restartButton = makeButton(
    "Restart",
    controls,
    restartGame,
    "#7c3aed"
  );

  textFont("Arial");
  restartGame();
}

function makeButton(label, parent, action, color) {
  const button = createButton(label);
  button.parent(parent);
  button.mousePressed(action);
  button.style("padding", "12px 16px");
  button.style("font-size", "16px");
  button.style("font-weight", "bold");
  button.style("border", "none");
  button.style("border-radius", "8px");
  button.style("background", color);
  button.style("color", "white");
  button.style("cursor", "pointer");
  return button;
}

function setEnabled(element, enabled) {
  element.elt.disabled = !enabled;
  element.style("opacity", enabled ? "1" : "0.45");
  element.style("cursor", enabled ? "pointer" : "not-allowed");
}

function updateControls() {
  const canGuess = !finished && !answered && !loading && !imageFailed;

  guessInput.elt.disabled = !canGuess;
  setEnabled(guessButton, canGuess);

  // If an image fails, the player can reveal it and move on.
  setEnabled(revealButton, !finished && !answered && !loading);
  setEnabled(nextButton, !finished && answered);
}

function restartGame() {
  deck = shuffle(countries.slice());

  score = 0;
  attempts = 0;
  streak = 0;
  bestStreak = 0;

  finished = false;
  current = null;

  nextFlag();
}

function nextFlag() {
  // Prevent skipping an unanswered question.
  if (current && !answered && !finished) return;

  if (deck.length === 0) {
    finished = true;
    flagImage = null;
    feedback = "";
    imageRequestId++;
    updateControls();
    return;
  }

  current = deck.pop();

  flagImage = null;
  loading = true;
  imageFailed = false;
  answered = false;
  feedback = "";

  guessInput.value("");
  updateControls();

  const requestId = ++imageRequestId;

  loadImage(
    `https://flagcdn.com/w320/${current.code}.png`,
    image => {
      if (requestId !== imageRequestId) return;

      flagImage = image;
      loading = false;
      updateControls();
      guessInput.elt.focus();
    },
    () => {
      if (requestId !== imageRequestId) return;

      loading = false;
      imageFailed = true;
      updateControls();
    }
  );
}

// Ignore capitalization, accents, punctuation, and extra spaces.
function normalizeAnswer(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]/g, "");
}

function submitGuess() {
  if (answered || finished || loading || imageFailed) return;

  const rawGuess = guessInput.value().trim();

  if (!rawGuess) {
    feedback = "Type a guess first!";
    feedbackColor = "#fbbf24";
    return;
  }

  const acceptedAnswers = [current.name, ...current.aliases];
  const correct = acceptedAnswers.some(
    answer => normalizeAnswer(answer) === normalizeAnswer(rawGuess)
  );

  answered = true;
  attempts++;

  if (correct) {
    score++;
    streak++;
    bestStreak = max(bestStreak, streak);

    feedback = `Correct! The answer is ${current.name}.`;
    feedbackColor = "#86efac";
  } else {
    streak = 0;

    feedback = `Not quite! The answer is ${current.name}.`;
    feedbackColor = "#fca5a5";
  }

  updateControls();
  nextButton.elt.focus();
}

function revealAnswer() {
  if (answered || finished || loading) return;

  answered = true;
  attempts++;
  streak = 0;

  feedback = `The answer is ${current.name}.`;
  feedbackColor = "#fbbf24";

  updateControls();
  nextButton.elt.focus();
}

function draw() {
  background("#0b1220");

  noStroke();
  textAlign(CENTER, CENTER);

  fill("#f8fafc");
  textSize(32);
  textStyle(BOLD);
  text("FLAG TRIVIA", width / 2, 42);
  textStyle(NORMAL);

  fill("#a8b8d8");
  textSize(16);
  text(
    `${countries.length} flags • Guess the country or nation`,
    width / 2,
    78
  );

  fill("#dce6ff");
  textSize(17);
  text(
    `Score: ${score}/${attempts}     Streak: ${streak}     Best: ${bestStreak}`,
    width / 2,
    116
  );

  if (finished) {
    drawFinishedScreen();
    return;
  }

  fill("#17243d");
  rect(60, 155, 600, 255, 16);

  if (loading) {
    fill("#dce6ff");
    textSize(23);
    text("Loading flag...", width / 2, 280);
  } else if (imageFailed) {
    fill("#fbbf24");
    textSize(20);
    text(
      "The flag image could not load.\nCheck your internet, then reveal and continue.",
      90,
      240,
      540,
      90
    );
  } else if (flagImage) {
    // Preserve each flag's actual proportions.
    const scale = min(520 / flagImage.width, 215 / flagImage.height);
    const flagWidth = flagImage.width * scale;
    const flagHeight = flagImage.height * scale;

    image(
      flagImage,
      (width - flagWidth) / 2,
      282 - flagHeight / 2,
      flagWidth,
      flagHeight
    );
  }

  fill(feedbackColor);
  textSize(22);

  if (feedback) {
    text(feedback, 45, 422, 630, 65);
  } else {
    fill("#a8b8d8");
    textSize(18);
    text("Which country or nation does this flag represent?", width / 2, 452);
  }

  fill("#a8b8d8");
  textSize(14);
  text(
    `Flag ${countries.length - deck.length} of ${countries.length}`,
    width / 2,
    501
  );
}

function drawFinishedScreen() {
  const accuracy = attempts > 0 ? round((score / attempts) * 100) : 0;

  fill("#86efac");
  textSize(34);
  text("Game complete!", width / 2, 222);

  fill("#f8fafc");
  textSize(25);
  text(`You got ${score} out of ${attempts} correct.`, width / 2, 281);

  fill("#dce6ff");
  textSize(22);
  text(`Accuracy: ${accuracy}%`, width / 2, 326);
  text(`Best streak: ${bestStreak}`, width / 2, 367);

  fill("#a8b8d8");
  textSize(18);
  text("Click Restart for a newly shuffled game.", width / 2, 433);
}
