(() => {
  'use strict';

  const EXACT = {
    'LG Pro 55-inch 4K Smart TV': {
      model: '55UP7550 series',
      specs: ['55-inch class display', '4K UHD resolution', 'Smart TV platform', 'HDR support', 'Wi-Fi connectivity']
    },
    'Sony Elite 65-inch 4K Smart TV': {
      model: '65-inch 4K Smart TV series',
      specs: ['65-inch class display', '4K UHD resolution', 'Smart TV streaming apps', 'HDR picture support', 'Multiple HDMI inputs']
    },
    'LG Standard Soundbar with Subwoofer': {
      model: 'SK8 series',
      specs: ['Soundbar + wireless subwoofer', 'TV audio upgrade system', 'Bluetooth audio', 'HDMI connection', 'Wall-mount capable']
    },
    'TCL Premium 27-inch Monitor': {
      model: '27G64 series',
      specs: ['27-inch display', 'Desktop monitor', 'High-refresh gaming-style panel', 'HDMI / DisplayPort connectivity', 'VESA-mount compatible']
    },
    'Whirlpool Plus French Door Refrigerator': {
      model: 'French-door series',
      specs: ['Full-size French-door refrigerator', 'Bottom freezer', 'Adjustable interior shelving', 'Door storage bins', 'Stainless-style finish']
    },
    'GE Standard Air Fryer': {
      model: 'G9OAAASSPSS series',
      specs: ['Countertop air-fry/toaster oven', 'Stainless-steel exterior', 'Multiple cooking modes', 'Front control panel', 'Removable cooking rack']
    },
    'Bowflex Pro Adjustable Dumbbell Set': {
      model: 'SelectTech 552 style',
      specs: ['Pair of adjustable dumbbells', 'Dial-select weight adjustment', 'Space-saving design', 'Multiple weight settings', 'Home-gym use']
    }
  };

  function cleanName(name) {
    return String(name || '').replace(/\s+/g, ' ').trim();
  }

  function inferredDetails(name) {
    const n = cleanName(name);
    const details = [];
    let model = 'Retail series / configuration';

    const inch = n.match(/(\d{2,3})-inch/i);
    if (inch) details.push(`${inch[1]}-inch size`);

    const pieces = n.match(/(\d+)-Piece/i);
    if (pieces) details.push(`${pieces[1]}-piece set`);

    const seats = n.match(/(\d+)-Seat/i);
    if (seats) details.push(`${seats[1]}-seat configuration`);

    if (/4K Smart TV/i.test(n)) {
      details.push('4K UHD resolution', 'Built-in smart streaming', 'HDR-capable display', 'Wi-Fi + HDMI connectivity');
    } else if (/Soundbar/i.test(n)) {
      details.push('Soundbar speaker system', 'Includes subwoofer', 'Bluetooth playback', 'TV audio connectivity');
    } else if (/Laptop/i.test(n)) {
      details.push('Portable notebook computer', 'Integrated display and keyboard', 'Wi-Fi/Bluetooth', 'Rechargeable battery');
    } else if (/Monitor/i.test(n)) {
      details.push('Desktop display', 'HDMI-compatible input', 'Adjustable display settings', 'VESA-mount capability');
    } else if (/Tablet/i.test(n)) {
      details.push('Touchscreen tablet', 'Wi-Fi connectivity', 'Front/rear cameras', 'Rechargeable battery');
    } else if (/Refrigerator/i.test(n)) {
      details.push('Full-size kitchen appliance', 'Refrigerator/freezer storage', 'Adjustable shelving', 'Interior LED lighting');
    } else if (/Dishwasher/i.test(n)) {
      details.push('Built-in dishwasher', 'Multiple wash cycles', 'Upper and lower racks', 'Front or top controls');
    } else if (/Air Fryer/i.test(n)) {
      details.push('Countertop cooking appliance', 'Air-fry cooking mode', 'Adjustable temperature', 'Removable cooking tray/basket');
    } else if (/Stand Mixer/i.test(n)) {
      details.push('Countertop stand mixer', 'Multiple speed settings', 'Mixing bowl included', 'Attachment-ready design');
    } else if (/Washer/i.test(n)) {
      details.push('Front-load laundry washer', 'Multiple wash cycles', 'High-efficiency operation', 'Full-size household capacity');
    } else if (/Dryer/i.test(n)) {
      details.push('Full-size electric dryer', 'Multiple drying cycles', 'Front-loading drum', 'Household laundry appliance');
    } else if (/Sofa|Sectional/i.test(n)) {
      details.push('Upholstered seating', 'Multi-seat configuration', 'Residential living-room furniture', 'Assembly may be required');
    } else if (/Bed Frame/i.test(n)) {
      details.push('Queen-size bed frame', 'Headboard/rail configuration', 'Residential bedroom furniture', 'Mattress sold separately');
    } else if (/Mattress/i.test(n)) {
      details.push('Queen-size mattress', 'Residential sleep surface', 'Multi-layer comfort construction', 'Designed for standard queen frame');
    } else if (/Dining Table/i.test(n)) {
      details.push('Dining-height table', 'Multi-person seating capacity', 'Residential dining furniture', 'Wood/metal-style construction');
    } else if (/Standing Desk/i.test(n)) {
      details.push('Height-adjustable workstation', 'Desktop work surface', 'Sit/stand use', 'Home-office configuration');
    } else if (/Cordless Drill/i.test(n)) {
      details.push('Cordless drill/driver', 'Rechargeable battery system', 'Variable-speed trigger', 'Drill kit configuration');
    } else if (/Miter Saw/i.test(n)) {
      details.push('Powered miter saw', 'Angled cross-cut capability', 'Bench-top tool', 'Blade guard and fence system');
    } else if (/Table Saw/i.test(n)) {
      details.push('Portable/bench table saw', 'Rip fence system', 'Adjustable cutting depth', 'Workshop power tool');
    } else if (/Lawn Mower/i.test(n)) {
      details.push('Battery-powered mower', 'Walk-behind design', 'Adjustable cutting height', 'Rechargeable outdoor power equipment');
    } else if (/Pressure Washer/i.test(n)) {
      details.push('Outdoor pressure washer', 'High-pressure hose', 'Spray wand', 'Exterior-cleaning equipment');
    } else if (/Tool Chest/i.test(n)) {
      details.push('Portable tool-storage system', 'Multiple storage compartments', 'Heavy-duty construction', 'Workshop/transport use');
    } else if (/Cookware Set/i.test(n)) {
      details.push('Multi-piece cookware set', 'Assorted pots and pans', 'Kitchen cooking set', 'Matching lids/handles');
    } else if (/Dutch Oven/i.test(n)) {
      details.push('Cast-iron Dutch oven', 'Heavy covered cooking pot', 'Oven/stovetop use', 'Heat-retaining construction');
    } else if (/Knife Set/i.test(n)) {
      details.push('Multi-knife kitchen set', 'Countertop storage block', 'Assorted blade styles', 'Food-prep use');
    } else if (/Dinnerware Set/i.test(n)) {
      details.push('Coordinated dinnerware set', 'Plates/bowls configuration', 'Multi-place setting', 'Tabletop use');
    } else if (/Flatware Set/i.test(n)) {
      details.push('Coordinated flatware set', 'Forks/knives/spoons included', 'Multi-place setting', 'Stainless-style construction');
    } else if (/Treadmill/i.test(n)) {
      details.push('Motorized treadmill', 'Running/walking deck', 'Speed controls', 'Home-fitness console');
    } else if (/Exercise Bike/i.test(n)) {
      details.push('Stationary exercise bike', 'Adjustable resistance', 'Fitness console', 'Adjustable seat position');
    } else if (/Dumbbell/i.test(n)) {
      details.push('Adjustable dumbbell pair', 'Multiple weight settings', 'Compact home-gym design', 'Strength-training equipment');
    } else if (/Mountain Bike/i.test(n)) {
      details.push('Adult mountain-style bicycle', 'Multi-speed drivetrain', 'Trail/road capable tires', 'Front/rear braking system');
    } else if (/Golf Club Set/i.test(n)) {
      details.push('Complete golf-club set', 'Multiple club types', 'Golf bag configuration', 'Right/left-hand set depending on model');
    } else if (/Kayak/i.test(n)) {
      details.push('Recreational kayak', 'Single-rider watercraft', 'Molded seating area', 'Paddle-sport use');
    } else if (/Building Block Set/i.test(n)) {
      details.push('Large construction-toy set', 'Multiple interlocking pieces', 'Build-and-play format', 'Reusable components');
    } else if (/Remote Control Truck/i.test(n)) {
      details.push('Remote-control vehicle', 'Handheld controller', 'Battery-powered drive', 'Off-road truck styling');
    } else if (/Ride-On Toy Car/i.test(n)) {
      details.push('Child ride-on vehicle', 'Battery-powered drive', 'Seat and steering controls', 'Indoor/outdoor play use');
    } else if (/Arcade Cabinet/i.test(n)) {
      details.push('Home arcade cabinet', 'Integrated display and controls', 'Upright cabinet format', 'Plug-in game system');
    } else if (/Foosball Table/i.test(n)) {
      details.push('Full-size foosball game table', 'Player rods and scoring system', 'Indoor game-room use', 'Assembly required');
    } else if (/Electric Guitar/i.test(n)) {
      details.push('Solid-body electric guitar', 'Six-string configuration', 'Pickup and control electronics', 'Standard guitar scale');
    } else if (/Acoustic Guitar/i.test(n)) {
      details.push('Six-string acoustic guitar', 'Hollow-body construction', 'Standard tuning configuration', 'Acoustic performance instrument');
    } else if (/Digital Piano/i.test(n)) {
      details.push('Digital keyboard piano', 'Full-size piano-style keys', 'Built-in sounds', 'Headphone/audio connectivity');
    } else if (/Drum Kit/i.test(n)) {
      details.push('Electronic drum kit', 'Mesh/electronic pads', 'Drum sound module', 'Headphone/audio output');
    } else if (/Trumpet/i.test(n)) {
      details.push('B-flat trumpet-style instrument', 'Three-valve configuration', 'Brass instrument format', 'Case/mouthpiece depending on package');
    } else if (/Patio Dining Set/i.test(n)) {
      details.push('7-piece outdoor dining set', 'Table plus matching chairs', 'Outdoor-rated construction', 'Patio/deck use');
    } else if (/Outdoor Sectional/i.test(n)) {
      details.push('Multi-piece outdoor sectional', 'Weather-resistant style upholstery', 'Patio seating configuration', 'Modular arrangement');
    } else if (/Gas Grill/i.test(n)) {
      details.push('Outdoor gas griddle/grill', 'Large flat cooking surface', 'Multiple heat zones', 'Outdoor cooking station');
    } else if (/Pellet Grill/i.test(n)) {
      details.push('Wood-pellet grill/smoker', 'Digital temperature control', 'Outdoor cooking chamber', 'Low-and-slow smoking capability');
    } else if (/Gazebo/i.test(n)) {
      details.push('Outdoor gazebo structure', 'Covered patio footprint', 'Weather-resistant frame', 'Assembly-required shelter');
    }

    if (!details.length) details.push('Consumer retail product', 'Standard retail configuration', 'Brand/model features vary by series');
    return { model, specs: details.slice(0, 5) };
  }

  function detailsFor(name) {
    return EXACT[cleanName(name)] || inferredDetails(name);
  }

  function injectDetails() {
    const overlay = document.getElementById('tapPriceGuess');
    if (!overlay) return;
    const nameNode = overlay.querySelector('.name');
    if (!nameNode) return;
    const name = cleanName(nameNode.textContent);
    if (!name) return;

    let box = overlay.querySelector('.nyp-details');
    if (!box) {
      box = document.createElement('section');
      box.className = 'nyp-details';
      nameNode.insertAdjacentElement('afterend', box);
    }
    if (box.dataset.product === name) return;
    box.dataset.product = name;

    const data = detailsFor(name);
    box.innerHTML = `
      <div class="nyp-details-title">PRODUCT DETAILS</div>
      <div class="nyp-model"><span>Model / Series</span><strong>${escapeHtml(data.model)}</strong></div>
      <ul>${data.specs.map(spec => `<li>${escapeHtml(spec)}</li>`).join('')}</ul>
    `;
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  const style = document.createElement('style');
  style.textContent = `
    #tapPriceGuess .nyp-details{margin:14px 0 10px;padding:14px 16px;border:1px solid #3b414a;border-radius:14px;background:#15181c}
    #tapPriceGuess .nyp-details-title{font-size:12px;font-weight:950;letter-spacing:.13em;color:#aeb5c0;margin-bottom:8px}
    #tapPriceGuess .nyp-model{display:flex;justify-content:space-between;gap:12px;align-items:baseline;padding-bottom:8px;border-bottom:1px solid #30353c}
    #tapPriceGuess .nyp-model span{font-size:13px;color:#aeb5c0;font-weight:800}
    #tapPriceGuess .nyp-model strong{text-align:right;font-size:15px}
    #tapPriceGuess .nyp-details ul{margin:10px 0 0;padding-left:20px;display:grid;gap:5px;color:#e8ebef;font-size:15px;font-weight:650;line-height:1.35}
    @media(max-width:760px){#tapPriceGuess .nyp-model{display:block}#tapPriceGuess .nyp-model strong{display:block;text-align:left;margin-top:3px}}
  `;
  document.head.appendChild(style);

  const observer = new MutationObserver(() => injectDetails());
  observer.observe(document.documentElement, { childList: true, subtree: true, characterData: true });
  injectDetails();
})();
