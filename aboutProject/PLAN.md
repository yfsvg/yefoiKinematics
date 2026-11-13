# yefoiKinematics

A browser playground for forward and inverse kinematics in 2D and 3D. You move sliders or drag a target, the robot arm moves, and the linear algebra is always available in a side panel or whatever so students can let it happen.

After doing some basic research, found very little good alternatives for web-based, easy and accessible tools that help people do that. **The goal is to be operational the MOMENT you click the link**, no install no hassle or whatever. It should be instant, frictionless, and easy to learn from as well.

Can also include sidebar info discussing topics, press a button and an example scenario appears, etc.

## Stack
1. Rendering (2D + 3D): Three.js. REASON why is because it keeps the visual style consistent, and also means that its seamless switching between 2D and 3D, no extra learning stuff, and everything just WORKS the same. Might be some performance issues down the line with using three.js in 2D, we'll have to see then, but from my perspective this is the easiest programming path right now.
2. Frontend: All vanilla html / css in order to keep things simple, this project is gonna have like 4 pages total anyways
3. UI help: LaTeX obviously for rendering math as sliders move, KaTeX maybe if demanded although not familiar with that thing yet.

## Repo layout
```
yefoiKinematics/
├── index.html (Landing page)
├── fk2d.html
├── fk3d.html
├── ik2d.html
├── ik3d.html
├── style.css
├── js/
│   ├── math.js (Shared math.js file for all vector calculations)
│   ├── nav.js
│   ├── fk2d.js
│   ├── fk3d.js
│   ├── ik2d.js
│   └── ik3d.js
├── PLAN.md
└── README.md
```

## Big stretch ideas
- Quiz mode to truly strengthen the educational framing
- Additional info to the side that explains foundational concepts so its a self-standing learning app rather than JUST a lone app.
- Prismatic joints!
- Exporting functions for scenarios, DH tables, and matrices








# Contact
Contact me at:
@yefoi on discord 😹
yifeichengmi@gmail.com on email 🙀