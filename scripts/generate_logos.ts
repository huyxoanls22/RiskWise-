import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const LOGOS_DIR = path.join(process.cwd(), 'public', 'logos');
const PARTNERS_DIR = path.join(LOGOS_DIR, 'partners');

// Ensure directories exist
if (!fs.existsSync(LOGOS_DIR)) {
  fs.mkdirSync(LOGOS_DIR, { recursive: true });
}
if (!fs.existsSync(PARTNERS_DIR)) {
  fs.mkdirSync(PARTNERS_DIR, { recursive: true });
}

// Beautiful SVG for default logo
const createDefaultSvg = () => `
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <!-- Solid elegant background -->
  <rect width="512" height="512" rx="64" fill="#0D1117"/>
  <!-- Subtle circular gradient glow -->
  <circle cx="256" cy="256" r="220" fill="url(#glowGradient)" opacity="0.15"/>
  
  <defs>
    <radialGradient id="glowGradient" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#4F46E5"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="silverGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#E2E8F0"/>
      <stop offset="50%" stop-color="#94A3B8"/>
      <stop offset="100%" stop-color="#CBD5E1"/>
    </linearGradient>
    <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FCD34D"/>
      <stop offset="50%" stop-color="#F59E0B"/>
      <stop offset="100%" stop-color="#D97706"/>
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="8" stdDeviation="10" flood-color="#000000" flood-opacity="0.5"/>
    </filter>
  </defs>

  <!-- Shield G -->
  <g filter="url(#shadow)" transform="translate(16, 16)">
    <!-- Outer Shield Border -->
    <path d="M 240,50 
             C 340,50 400,80 400,180 
             C 400,300 320,380 240,430 
             C 160,380 80,300 80,180 
             C 80,80 140,50 240,50 Z" 
          fill="none" 
          stroke="url(#silverGradient)" 
          stroke-width="14" 
          stroke-linejoin="round"/>

    <!-- Inner Shield Line -->
    <path d="M 240,75 
             C 320,75 375,100 375,180 
             C 375,280 305,350 240,395 
             C 175,350 105,280 105,180 
             C 105,100 160,75 240,75 Z" 
          fill="none" 
          stroke="url(#silverGradient)" 
          stroke-width="4" 
          stroke-opacity="0.4"
          stroke-linejoin="round"/>

    <!-- Interlocked R logo path -->
    <path d="M 170,140 
             L 245,140 
             C 285,140 310,165 310,205 
             C 310,245 285,270 245,270 
             L 170,270" 
          fill="none" 
          stroke="url(#silverGradient)" 
          stroke-width="16" 
          stroke-linecap="round"
          stroke-linejoin="round"/>
          
    <path d="M 170,140 L 170,350" 
          fill="none" 
          stroke="url(#silverGradient)" 
          stroke-width="16" 
          stroke-linecap="round"/>

    <path d="M 235,270 L 305,350" 
          fill="none" 
          stroke="url(#silverGradient)" 
          stroke-width="16" 
          stroke-linecap="round"
          stroke-linejoin="round"/>

    <!-- Interlocked W gold accent path -->
    <path d="M 195,240 
             L 225,335 
             L 255,245 
             L 285,335 
             L 315,240" 
          fill="none" 
          stroke="url(#goldGradient)" 
          stroke-width="8" 
          stroke-opacity="0.95"
          stroke-linecap="round"
          stroke-linejoin="round"/>
  </g>
</svg>
`;

// Beautiful SVG for test partner logo ("tuan_logo") resembling the uploaded cartoon baby reference image
const createPartnerSvg = (partnerName: string) => `
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <!-- Gradient background resembling the cute baby room (soft teal and baby pink) -->
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#BAE6FD" />
      <stop offset="50%" stop-color="#E0F2FE" />
      <stop offset="100%" stop-color="#FCE7F3" />
    </linearGradient>
    
    <linearGradient id="goldText" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#FFE135" />
      <stop offset="100%" stop-color="#FFD600" />
    </linearGradient>
    
    <filter id="softShadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#0F172A" flood-opacity="0.15"/>
    </filter>
    
    <filter id="textShadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="3" dy="6" stdDeviation="0" flood-color="#854D0E" flood-opacity="1"/>
      <feDropShadow dx="-3" dy="-3" stdDeviation="0" flood-color="#FFFFFF" flood-opacity="0.9"/>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="512" height="512" rx="48" fill="url(#bgGrad)"/>
  
  <!-- Floating stars & circles -->
  <!-- Yellow Star -->
  <path d="M 120,120 L 125,135 L 140,138 L 128,148 L 132,163 L 120,154 L 108,163 L 112,148 L 100,138 L 115,135 Z" fill="#FDE047" stroke="#CA8A04" stroke-width="3" filter="url(#softShadow)"/>
  
  <!-- Balloons/circles -->
  <circle cx="380" cy="120" r="22" fill="#F472B6" />
  <circle cx="395" cy="145" r="28" fill="#4ADE80" opacity="0.9" />
  
  <!-- Question Marks -->
  <!-- Left Pink ? -->
  <text x="95" y="210" fill="#EC4899" font-family="'Arial Black', sans-serif" font-weight="900" font-size="52" transform="rotate(-15, 95, 210)" filter="url(#softShadow)">?</text>
  <!-- Center Question Mark -->
  <text x="145" y="190" fill="#94A3B8" font-family="'Arial Black', sans-serif" font-weight="900" font-size="28" opacity="0.6">?</text>
  <!-- Right Yellow ? -->
  <text x="420" y="220" fill="#EAB308" font-family="'Arial Black', sans-serif" font-weight="900" font-size="52" transform="rotate(15, 420, 220)" filter="url(#softShadow)">?</text>

  <!-- Heart Shape with ? -->
  <g transform="translate(390, 240) scale(1.1)">
    <path d="M 12,5 C 8,0 0,0 0,8 C 0,15 12,23 12,23 C 12,23 24,15 24,8 C 24,0 16,0 12,5 Z" fill="#FB7185" stroke="#E11D48" stroke-width="2"/>
    <text x="12" y="15" fill="#FFFFFF" font-family="sans-serif" font-weight="bold" font-size="12" text-anchor="middle">?</text>
  </g>
  
  <circle cx="120" cy="275" r="22" fill="#38BDF8" opacity="0.8"/>

  <!-- Cute Baby Character -->
  <g filter="url(#softShadow)">
    <!-- Ears -->
    <circle cx="180" cy="260" r="24" fill="#FDBA74" />
    <circle cx="180" cy="260" r="14" fill="#FECDD3" />
    <circle cx="332" cy="260" r="24" fill="#FDBA74" />
    <circle cx="332" cy="260" r="14" fill="#FECDD3" />

    <!-- Face / Head -->
    <ellipse cx="256" cy="260" rx="82" ry="74" fill="#FDBA74" />
    
    <!-- Hair (cute swoop on top) -->
    <path d="M 210,195 C 210,195 230,140 270,140 C 310,140 310,190 315,195 C 315,195 300,180 275,185 C 250,190 220,185 210,195 Z" fill="#78350F" />
    <path d="M 245,185 C 235,160 215,145 200,165 C 215,175 230,180 245,185 Z" fill="#78350F" />

    <!-- Cheeks (cute pink blush) -->
    <circle cx="195" cy="285" r="14" fill="#F43F5E" opacity="0.4" />
    <circle cx="317" cy="285" r="14" fill="#F43F5E" opacity="0.4" />

    <!-- Big glossy cute eyes -->
    <!-- Left Eye -->
    <circle cx="215" cy="260" r="22" fill="#1E293B" />
    <circle cx="210" cy="252" r="8" fill="#FFFFFF" />
    <circle cx="222" cy="266" r="4" fill="#FFFFFF" />
    
    <!-- Right Eye -->
    <circle cx="297" cy="260" r="22" fill="#1E293B" />
    <circle cx="292" cy="252" r="8" fill="#FFFFFF" />
    <circle cx="304" cy="266" r="4" fill="#FFFFFF" />

    <!-- Cute little curved eyebrows -->
    <path d="M 195,232 Q 215,222 230,234" fill="none" stroke="#78350F" stroke-width="4" stroke-linecap="round" />
    <path d="M 282,234 Q 297,222 317,232" fill="none" stroke="#78350F" stroke-width="4" stroke-linecap="round" />

    <!-- Tiny cute nose -->
    <path d="M 252,275 Q 256,279 260,275" fill="none" stroke="#9A3412" stroke-width="3" stroke-linecap="round" />

    <!-- Sweet open mouth showing tongue -->
    <path d="M 238,290 C 238,290 240,320 256,320 C 272,320 274,290 274,290 Z" fill="#991B1B" />
    <path d="M 244,302 C 248,312 264,312 268,302 C 260,305 252,305 244,302 Z" fill="#FDA4AF" />
  </g>

  <!-- Box the baby pops out of -->
  <g filter="url(#softShadow)">
    <path d="M 156,350 L 356,350 L 340,430 L 172,430 Z" fill="#0EA5E9" stroke="#0284C7" stroke-width="4" stroke-linejoin="round"/>
    <path d="M 156,350 L 256,370 L 356,350" fill="none" stroke="#F43F5E" stroke-width="12" stroke-linecap="round"/>
    <rect x="246" y="350" width="20" height="80" fill="#F43F5E" />
  </g>

  <!-- Big bubbly Vietnamese text: "CÁI GÌ ĐÂY?" exactly styled matching the reference in bright yellow with black and white outline -->
  <g filter="url(#textShadow)">
    <text x="256" y="458" 
          fill="url(#goldText)" 
          stroke="#1E293B"
          stroke-width="14"
          paint-order="stroke fill"
          font-family="'Arial Black', 'Impact', 'Comic Sans MS', sans-serif" 
          font-size="58" 
          font-weight="900" 
          letter-spacing="1"
          text-anchor="middle">CÁI GÌ ĐÂY?</text>
  </g>
</svg>
`;

async function main() {
  console.log('Generating beautiful default and partner logos...');
  
  const defaultSvgBuffer = Buffer.from(createDefaultSvg());
  const partnerSvgBuffer = Buffer.from(createPartnerSvg('tuan'));

  await sharp(defaultSvgBuffer)
    .png()
    .toFile(path.join(LOGOS_DIR, 'riskwise_default.png'));
    
  await sharp(partnerSvgBuffer)
    .png()
    .toFile(path.join(PARTNERS_DIR, 'tuan_logo.png'));

  console.log('Successfully generated all logo PNGs in /public/logos!');
}

main().catch(console.error);
