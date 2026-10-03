import re

with open('src/constants/emojis.ts', 'r') as f:
    content = f.read()

new_categories = """
  },
  {
    id: 'flags',
    name: 'Vlaggen',
    icon: '🏳️‍🌈',
    emojis: [
      { emoji: '🏁', name: 'checkered_flag', keywords: ['race', 'finish'] },
      { emoji: '🚩', name: 'triangular_flag_on_post', keywords: ['vlag', 'waarschuwing'] },
      { emoji: '🎌', name: 'crossed_flags', keywords: ['japan', 'vlag'] },
      { emoji: '🏴‍☠️', name: 'pirate_flag', keywords: ['piraat', 'schedel'] },
      { emoji: '🏳️‍🌈', name: 'rainbow_flag', keywords: ['pride', 'regenboog'] },
      { emoji: '🏳️‍⚧️', name: 'transgender_flag', keywords: ['transgender', 'pride'] },
      { emoji: '🇳🇱', name: 'netherlands', keywords: ['nederland', 'holland', 'nl'] },
      { emoji: '🇧🇪', name: 'belgium', keywords: ['belgië', 'be'] },
      { emoji: '🇩🇪', name: 'germany', keywords: ['duitsland', 'de'] },
      { emoji: '🇫🇷', name: 'france', keywords: ['frankrijk', 'fr'] },
      { emoji: '🇬🇧', name: 'uk', keywords: ['engeland', 'groot-brittannië', 'uk'] },
      { emoji: '🇺🇸', name: 'us', keywords: ['amerika', 'vs', 'us'] },
      { emoji: '🇪🇸', name: 'spain', keywords: ['spanje', 'es'] },
      { emoji: '🇮🇹', name: 'italy', keywords: ['italië', 'it'] },
      { emoji: '🇨🇦', name: 'canada', keywords: ['canada', 'ca'] },
      { emoji: '🇦🇺', name: 'australia', keywords: ['australië', 'au'] },
      { emoji: '🇯🇵', name: 'japan', keywords: ['japan', 'jp'] },
      { emoji: '🇨🇳', name: 'china', keywords: ['china', 'cn'] },
      { emoji: '🇧🇷', name: 'brazil', keywords: ['brazilië', 'br'] },
      { emoji: '🇦🇷', name: 'argentina', keywords: ['argentinië', 'ar'] },
      { emoji: '🇿🇦', name: 'south_africa', keywords: ['zuid-afrika', 'za'] },
      { emoji: '🇰🇷', name: 'south_korea', keywords: ['zuid-korea', 'kr'] },
      { emoji: '🇮🇳', name: 'india', keywords: ['india', 'in'] },
      { emoji: '🇹🇷', name: 'turkey', keywords: ['turkije', 'tr'] },
      { emoji: '🇲🇦', name: 'morocco', keywords: ['marokko', 'ma'] },
      { emoji: '🇸🇷', name: 'suriname', keywords: ['suriname', 'sr'] },
      { emoji: '🇨🇼', name: 'curacao', keywords: ['curaçao', 'cw'] },
      { emoji: '🇦🇼', name: 'aruba', keywords: ['aruba', 'aw'] },
      { emoji: '🇸🇽', name: 'sint_maarten', keywords: ['sint maarten', 'sx'] },
      { emoji: '🌍', name: 'earth_africa', keywords: ['wereld', 'aarde', 'afrika'] },
      { emoji: '🌎', name: 'earth_americas', keywords: ['wereld', 'aarde', 'amerika'] },
      { emoji: '🌏', name: 'earth_asia', keywords: ['wereld', 'aarde', 'azië'] },
      { emoji: '🏳️', name: 'white_flag', keywords: ['witte vlag', 'overgave'] },
      { emoji: '🏴', name: 'black_flag', keywords: ['zwarte vlag'] }
    ]
  },
  {
    id: 'extra_smileys',
    name: 'Nieuwe Smileys & Gebaren',
    icon: '🫠',
    emojis: [
      { emoji: '🫠', name: 'melting_face', keywords: ['smelten', 'heet'] },
      { emoji: '🫡', name: 'saluting_face', keywords: ['saluut', 'respect'] },
      { emoji: '🫢', name: 'face_with_open_eyes_and_hand_over_mouth', keywords: ['schrik', 'oeps'] },
      { emoji: '🫣', name: 'face_with_peeking_eye', keywords: ['gluren', 'kiekeboe'] },
      { emoji: '🫤', name: 'face_with_diagonal_mouth', keywords: ['twijfel', 'mwa'] },
      { emoji: '🫥', name: 'dotted_line_face', keywords: ['onzichtbaar', 'verdwijnen'] },
      { emoji: '🥹', name: 'face_holding_back_tears', keywords: ['trots', 'tranen', 'lief'] },
      { emoji: '🫶', name: 'heart_hands', keywords: ['liefde', 'hart', 'handen'] },
      { emoji: '🫰', name: 'hand_with_index_finger_and_thumb_crossed', keywords: ['liefde', 'hart', 'korea'] },
      { emoji: '🫵', name: 'index_pointing_at_the_viewer', keywords: ['jij', 'wijzen'] },
      { emoji: '🫱', name: 'rightwards_hand', keywords: ['hand', 'rechts'] },
      { emoji: '🫲', name: 'leftwards_hand', keywords: ['hand', 'links'] },
      { emoji: '🫳', name: 'palm_down_hand', keywords: ['hand', 'onder'] },
      { emoji: '🫴', name: 'palm_up_hand', keywords: ['hand', 'boven'] },
      { emoji: '🫦', name: 'biting_lip', keywords: ['lip', 'bijten', 'flirt'] },
      { emoji: '🧌', name: 'troll', keywords: ['trol', 'monster'] },
      { emoji: '🪩', name: 'mirror_ball', keywords: ['disco', 'feest'] },
      { emoji: '🫧', name: 'bubbles', keywords: ['bubbels', 'zeep'] },
      { emoji: '🪫', name: 'low_battery', keywords: ['batterij', 'leeg'] },
      { emoji: '🪪', name: 'identification_card', keywords: ['id', 'kaart', 'pas'] },
      { emoji: '🪬', name: 'hamsa', keywords: ['hamsa', 'oog'] },
      { emoji: '🪷', name: 'lotus', keywords: ['lotus', 'bloem', 'zen'] },
      { emoji: '🪸', name: 'coral', keywords: ['koraal', 'zee'] },
      { emoji: '🪹', name: 'empty_nest', keywords: ['nest', 'leeg'] },
      { emoji: '🪺', name: 'nest_with_eggs', keywords: ['nest', 'eieren'] },
      { emoji: '🫘', name: 'beans', keywords: ['bonen'] },
      { emoji: '🫗', name: 'pouring_liquid', keywords: ['schenken', 'drinken'] },
      { emoji: '🫙', name: 'jar', keywords: ['pot'] },
      { emoji: '🛝', name: 'playground_slide', keywords: ['glijbaan', 'spelen'] },
      { emoji: '🛞', name: 'wheel', keywords: ['wiel', 'band'] },
      { emoji: '🛟', name: 'ring_buoy', keywords: ['reddingsboei', 'redden'] },
      { emoji: '🩼', name: 'crutch', keywords: ['kruk', 'gewond'] },
      { emoji: '🩻', name: 'x_ray', keywords: ['foto', 'bot', 'ziekenhuis'] }
    ]
  }
];
"""

content = content.replace("    ]\n  }\n];", new_categories)

with open('src/constants/emojis.ts', 'w') as f:
    f.write(content)
