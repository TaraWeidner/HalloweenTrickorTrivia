export const categories = [
  { name: 'Slashers & Scream Queens', questions: [
    ['Which masked killer stalks Haddonfield?', ['Michael Myers','Jason Voorhees','Ghostface','Leatherface'], 'Michael Myers', 'The Shape first appeared in John Carpenter’s Halloween.'],
    ['In the first Friday the 13th film, who is the killer?', ['Jason Voorhees','Pamela Voorhees','Tommy Jarvis','Roy Burns'], 'Pamela Voorhees', 'Jason becomes the central killer later in the series.'],
    ['Which weapon is most associated with Leatherface?', ['Machete','Chainsaw','Hook','Axe'], 'Chainsaw', 'Leatherface is the chainsaw-wielding figure from The Texas Chain Saw Massacre.'],
    ['Which film introduced Ghostface?', ['Scream','Urban Legend','The Strangers','Candyman'], 'Scream', 'Ghostface debuted in Wes Craven’s 1996 film.'],
    ['What is fitted to Freddy Krueger’s glove?', ['Needles','Razors','Hooks','Scissors'], 'Razors', 'Freddy’s glove carries four razor blades.']
  ]},
  { name: 'TV Terror', questions: [
    ['Which family lives at 1313 Mockingbird Lane?', ['The Addamses','The Munsters','The Crains','The Spellmans'], 'The Munsters', 'The Munsters live at 1313 Mockingbird Lane.'],
    ['What town is the setting of Stranger Things?', ['Sunnydale','Hawkins','Derry','Mystic Falls'], 'Hawkins', 'The series is set in fictional Hawkins, Indiana.'],
    ['Which series features Murder House, Asylum, and Coven?', ['Supernatural','American Horror Story','The Haunting','Channel Zero'], 'American Horror Story', 'Those are seasons of the anthology series.'],
    ['What is Sunnydale built over in Buffy?', ['A cemetery','A Hellmouth','An ancient crypt','A portal to Oz'], 'A Hellmouth', 'Sunnydale sits directly over a Hellmouth.'],
    ['Which series follows agents Mulder and Scully?', ['Fringe','The X-Files','Evil','Twin Peaks'], 'The X-Files', 'They investigate paranormal cases known as X-Files.']
  ]},
  { name: 'Haunted Lore', questions: [
    ['Which spirit’s wail is said to foretell death?', ['Banshee','Kelpie','Brownie','Selkie'], 'Banshee', 'The banshee comes from Irish folklore.'],
    ['The Winchester Mystery House is in which state?', ['Oregon','California','Nevada','Massachusetts'], 'California', 'It stands in San Jose, California.'],
    ['Which creature is tied to Point Pleasant, West Virginia?', ['Jersey Devil','Mothman','Flatwoods Monster','Fresno Nightcrawler'], 'Mothman', 'Mothman sightings became linked to Point Pleasant in the 1960s.'],
    ['Which ghost ship is doomed to sail forever?', ['Flying Dutchman','Mary Celeste','Queen Anne','Black Swan'], 'Flying Dutchman', 'The Flying Dutchman is said to be unable to make port.'],
    ['Poltergeist stories usually involve what?', ['Dreams','Moving objects and noises','Weather changes','Shape-shifting'], 'Moving objects and noises', 'Knocks and thrown objects are classic poltergeist activity.']
  ]},
  { name: 'Halloween History', questions: [
    ['Which ancient festival is often linked to Halloween?', ['Beltane','Samhain','Lupercalia','Saturnalia'], 'Samhain', 'Samhain marked the end of harvest and beginning of winter.'],
    ['Before pumpkins, what was commonly carved in Ireland?', ['Turnips','Potatoes','Beets','Cabbages'], 'Turnips', 'Turnips and other root vegetables were carved into lanterns.'],
    ['Which candy was once marketed as Chicken Feed?', ['Candy corn','Peeps','Tootsie Rolls','Bit-O-Honey'], 'Candy corn', 'Candy corn once used the name Chicken Feed.'],
    ['What color is the classic plastic pumpkin candy bucket?', ['Orange','Green','Purple','Blue'], 'Orange', 'The orange jack-o’-lantern bucket became a Halloween staple.'],
    ['Which line follows “Trick or treat” in the familiar rhyme?', ['Smell my feet','Give me something good to eat','Both','Neither'], 'Both', 'The playground rhyme commonly uses both lines.']
  ]},
  { name: 'Name That Nightmare', questions: [
    ['A videotape, a phone call, and seven days point to which film?', ['The Ring','Sinister','Pulse','Shutter'], 'The Ring', 'The cursed tape brings a seven-day death sentence.'],
    ['A puzzle box summons which beings?', ['Cenobites','Deadites','The Strangers','The Gentlemen'], 'Cenobites', 'The Lament Configuration summons the Cenobites in Hellraiser.'],
    ['Which hotel is central to The Shining?', ['The Stanley','The Overlook','The Cortez','The Bates'], 'The Overlook', 'The Torrance family winters at the Overlook Hotel.'],
    ['Jaws terrorizes which fictional island?', ['Skull Island','Amity Island','Summerisle','Shutter Island'], 'Amity Island', 'Jaws takes place around fictional Amity Island.'],
    ['Which film includes the line “They’re here”?', ['Poltergeist','The Exorcist','The Omen','The Others'], 'Poltergeist', 'Carol Anne announces the arrival with the famous line.']
  ]},
  { name: 'The Deep Dark', questions: [
    ['Who wrote The Colour Out of Space?', ['Edgar Allan Poe','H. P. Lovecraft','Algernon Blackwood','Arthur Machen'], 'H. P. Lovecraft', 'Lovecraft published the story in 1927.'],
    ['Which 1922 film introduced Count Orlok?', ['Häxan','Nosferatu','The Golem','Dr. Mabuse'], 'Nosferatu', 'Count Orlok is the vampire in F. W. Murnau’s film.'],
    ['What is the demon’s name in The Exorcist?', ['Pazuzu','Paimon','Bagul','Valak'], 'Pazuzu', 'Pazuzu is associated with Regan’s possession.'],
    ['Who created the haunted Hill House?', ['Shirley Jackson','Daphne du Maurier','Anne Rice','Susan Hill'], 'Shirley Jackson', 'Jackson wrote The Haunting of Hill House.'],
    ['Which 1960 film was adapted from Robert Bloch’s novel?', ['Peeping Tom','Psycho','Eyes Without a Face','Black Sunday'], 'Psycho', 'Hitchcock’s film was adapted from Bloch’s 1959 novel.']
  ]}
];

export const bonusQuestions = [
  { category: 'Dungeon Crawler Carl', value: 1000, text: 'What breed of cat is Princess Donut?', choices: ['Persian','Maine Coon','Siamese','Sphynx'], answer: 'Persian', fact: 'Princess Donut is a prizewinning Persian cat with a charisma score worthy of royalty.' },
  { category: 'Dungeon Crawler Carl', value: 1000, text: 'What is the name of Princess Donut’s dinosaur companion?', choices: ['Mongo','Gravy Boat','Ferdinand','Kiwi'], answer: 'Mongo', fact: 'Mongo is Donut’s bonded dinosaur companion and Royal Steed.' },
  { category: 'Dungeon Crawler Carl', value: 1000, text: 'Who serves as Carl and Donut’s tutorial guide and later manager?', choices: ['Mordecai','Prepotente','Chaco','Florin'], answer: 'Mordecai', fact: 'Mordecai begins as their dungeon guide and becomes their long-suffering manager.' },
  { category: 'Dungeon Crawler Carl', value: 1000, text: 'Before the collapse, Carl served in which branch of the U.S. military?', choices: ['Coast Guard','Army','Navy','Air Force'], answer: 'Coast Guard', fact: 'Carl is a former Coast Guard marine technician.' },
  { category: 'Dungeon Crawler Carl', value: 1000, text: 'What is the name of Carl’s ex-girlfriend?', choices: ['Beatrice','Odette','Katia','Imani'], answer: 'Beatrice', fact: 'Beatrice—usually called Bea—is Donut’s original owner and Carl’s ex.' },
  { category: 'Dungeon Crawler Carl', value: 1000, text: 'Who is Carl and Donut’s original public-relations representative?', choices: ['Zev','Odette','Loita','Hekla'], answer: 'Zev', fact: 'Zev communicates with the crawlers and manages their public image for Borant.' },
  { category: 'Dungeon Crawler Carl', value: 1000, text: 'Which intergalactic talk-show host interviews and advises Carl?', choices: ['Odette','Zev','Agatha','Elle'], answer: 'Odette', fact: 'Odette is a powerful media personality with a complicated connection to the crawl.' },
  { category: 'Dungeon Crawler Carl', value: 1000, text: 'How many levels are in Dungeon World: Earth?', choices: ['18','12','20','9'], answer: '18', fact: 'The World Dungeon is built as an eighteen-level survival crawl.' },
  { category: 'Dungeon Crawler Carl', value: 1000, text: 'What is the name of Carl and Donut’s party?', choices: ['Royal Court of Princess Donut','The Princess Posse','Safehome Yolanda','The Meadow Lark Crew'], answer: 'Royal Court of Princess Donut', fact: 'Naturally, Donut’s adventuring party carries her full royal branding.' },
  { category: 'Dungeon Crawler Carl', value: 1000, text: 'What is the Floor One borough boss defeated by Carl and his allies?', choices: ['Ball of Swine','Krakaren','Rage Elemental','The Butcher'], answer: 'Ball of Swine', fact: 'The Ball of Swine is the major borough boss confrontation on the first floor.' },
  { category: 'Dungeon Crawler Carl', value: 1000, text: 'What is Carl’s crawler number?', choices: ['4,122','4,123','5,000','18'], answer: '4,122', fact: 'Carl enters the dungeon as Crawler 4,122.' },
  { category: 'Dungeon Crawler Carl', value: 1000, text: 'What is Princess Donut’s crawler number?', choices: ['4,123','4,122','4,124','5,001'], answer: '4,123', fact: 'Donut follows Carl into the dungeon and is registered as Crawler 4,123.' },
  { category: 'Dungeon Crawler Carl', value: 1000, text: 'Which race does Carl select?', choices: ['Primal','Human','Skyfowl','Changeling'], answer: 'Primal', fact: 'Carl selects the Primal race when race and class choices become available.' },
  { category: 'Dungeon Crawler Carl', value: 1000, text: 'Which class does Carl select?', choices: ['Compensated Anarchist','Monster Truck Driver','Former Child Actor','Glass Cannon'], answer: 'Compensated Anarchist', fact: 'Compensated Anarchist is Carl’s appropriately disruptive class.' },
  { category: 'Dungeon Crawler Carl', value: 1000, text: 'Which class does Princess Donut initially select?', choices: ['Former Child Actor','Glass Cannon','Viper Queen','Bard'], answer: 'Former Child Actor', fact: 'Donut’s Former Child Actor class pairs beautifully with her enormous charisma.' },
  { category: 'Dungeon Crawler Carl', value: 1000, text: 'What is Princess Donut’s signature attack spell?', choices: ['Magic Missile','Laundry Day','Protective Shell','Puddle Jump'], answer: 'Magic Missile', fact: 'Donut’s eye-fired Magic Missile becomes one of her signature attacks.' },
  { category: 'Dungeon Crawler Carl', value: 1000, text: 'What royal title is given to Mongo?', choices: ['Royal Steed','Dungeon Prince','Grand Champion','Royal Bodyguard'], answer: 'Royal Steed', fact: 'Mongo is formally styled as Princess Donut’s Royal Steed.' },
  { category: 'Dungeon Crawler Carl', value: 1000, text: 'What is the fourth dungeon floor called?', choices: ['The Iron Tangle','The Bubbles','The Hunting Grounds','Faction Wars'], answer: 'The Iron Tangle', fact: 'The Iron Tangle is a sprawling and deeply confusing rail network.' },
  { category: 'Dungeon Crawler Carl', value: 1000, text: 'Which corporation operates the Earth crawl at the beginning of the series?', choices: ['Borant Corporation','Valtay Corporation','Open Intellect','The Plenty'], answer: 'Borant Corporation', fact: 'Borant operates and broadcasts Dungeon World: Earth.' },
  { category: 'Dungeon Crawler Carl', value: 1000, text: 'What was Mordecai’s original race?', choices: ['Skyfowl','Bopca','Primal','Cretin'], answer: 'Skyfowl', fact: 'Mordecai is originally a Skyfowl, though his appearance changes throughout the crawl.' }
];

// Keep the original single-question export available for the base engine.
export const bonus = bonusQuestions[0];

// Load targeted multiplayer fixes after the base engine has initialized.
window.setTimeout(() => {
  import('./live-fixes.js').catch(error => console.error('Live fixes failed to load:', error));
}, 0);
