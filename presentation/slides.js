window.presentationSlides = [
  {
    "type": "cover",
    "title": "Technical project experience",
    "section": "TECHNICAL INTERVIEW",
    "lead": "Vandi, Stairio, robot basketball and Stairio HR",
    "notes": "0:00–1:00  |  1 minute\n\nI’m Jack Zhao. I trained as a mechanical engineer and now work on robotic systems across the mechanism, embedded control and software. I’ll spend most of this session on Vandi and Stairio, then two shorter sections: robot basketball, where I led the team, and Stairio HR, a hiring system I built. Vandi starts with a vehicle I helped build and the decisions around who can command its motors. Stairio starts with a rail-mounted inspection robot and shows how I used field evidence and simulation to decide what to change and what still needed testing.",
    "sub": "Jack Zhao  /  Zhao Xuecen",
    "images": [
      {
        "src": "images/slide-01-1.webp",
        "fit": "cover",
        "alt": "Vandi team at the final-year project demonstration",
        "caption": null
      },
      {
        "src": "images/slide-01-2.webp",
        "fit": "cover",
        "alt": "Stairio 360 product render mounted on a handrail",
        "caption": null
      }
    ],
    "autoLead": {
      "exclude": [
        "Other work"
      ],
      "names": {
        "Robot basketball": "robot basketball"
      }
    }
  },
  {
    "type": "split",
    "title": "Mechanical engineering and robotics",
    "section": "BACKGROUND",
    "lead": "I work across mechanical design, embedded control and system testing.",
    "notes": "1:00–3:00  |  2 minutes\n\nMy mechanical training gave me a way to reason about loads, tolerances, manufacturing and assembly. Robotics made me extend that reasoning to system interfaces. A design can look fine in CAD and still fail because a sensor is stale, a control path bypasses a gate, or the wrong thing is being measured. I’ll show a few instances where those problems changed the design. Vandi was a three-person university project. Stairio is a team research and product effort, so I’ll point out what I owned and what I contributed.\n\nThe photos on the right cycle through Stairio, Vandi, robot basketball and the robot arm, the four projects in this talk.\n\nSource material\nCV facts and portfolio Stairio role and Vandi project pages.",
    "rows": [
      [
        "PolyU · BEng Mechanical Engineering",
        "Vandi was my interdisciplinary final-year project."
      ],
      [
        "Stairio · Robotics Systems Engineer",
        "I work on prototype CAD, robot interfaces and the software twin."
      ],
      [
        "How I test my work",
        "I compare the intended behavior with what the system actually does."
      ]
    ],
    "sub": null,
    "images": [
      {
        "src": "images/stairio-end-to-end-photo.jpg",
        "fit": "cover",
        "alt": "Photos of Jack Zhao’s projects",
        "caption": null,
        "gallery": [
          {
            "src": "images/stairio-end-to-end-photo.jpg",
            "label": "Stairio 360 in a stairwell",
            "alt": "Stairio 360 on a stairwell handrail beside a laptop showing its dashboard"
          },
          {
            "src": "images/slide-04-1.webp",
            "label": "Vandi on its test course",
            "alt": "Vandi fuel-cell robot car on its tabletop road course"
          },
          {
            "src": "../assets/projects/robot-basketball/goal.JPG",
            "label": "Robot basketball at the hoop",
            "alt": "The competition robot shooting at the hoop"
          },
          {
            "src": "../assets/projects/robot-arm-fk-ik/remaster/render-cad.webp",
            "label": "5-DOF robot arm CAD",
            "alt": "Render of the five-axis robot arm CAD"
          }
        ]
      }
    ]
  },
  {
    "type": "numbers",
    "title": "Presentation outline",
    "section": "45-MINUTE PRESENTATION",
    "lead": "Two project deep dives, two shorter case studies and a quick look at other work.",
    "notes": "3:00–4:00  |  1 minute\n\nGive the audience a map. Vandi starts with the real build, then gets into control and perception before looking at a separate simulation. Stairio starts with the actual inspection workflow, then goes into mechanism changes and evidence. Robot basketball and Stairio HR are shorter: one mechanism decision with a simulation follow-up, and one software system in daily use. The question in the Stairio section is a short thought experiment, so the technical talk still finishes at 45 minutes. Keep the full role discussion for afterward.",
    "numbers": [
      [
        "VANDI",
        "17 min",
        "Vehicle packaging, motor-command ownership, perception and an Isaac Lab run."
      ],
      [
        "STAIRIO",
        "19 min",
        "Inspection workflow, rail mechanism revisions, streaming and validation."
      ],
      [
        "OTHER WORK & CLOSE",
        "5 min",
        "Robot basketball, an active spoiler, a robot arm and the take-home handoff."
      ]
    ],
    "sub": "4 minutes for the opening and technical background. Role discussion follows the presentation.",
    "outline": true,
    "outlineCopy": {
      "Vandi": "Vehicle packaging, motor-command ownership, perception and an Isaac Lab run.",
      "Stairio": "Inspection workflow, rail mechanism revisions, streaming and validation.",
      "Robot basketball": "Shooter mechanism, team leadership and a 2026 Isaac Lab study.",
      "Stairio HR": "A hiring system in daily use and an enterprise prototype.",
      "Other work": "Spoiler, robot arm, auto shooter and the take-home handoff."
    }
  },
  {
    "type": "chapter",
    "title": "Vandi",
    "section": "PART 1  /  VANDI",
    "lead": "A fuel-cell robot car",
    "notes": "4:00–6:00  |  2 minutes\n\nThe brief was to design and build a small electric vehicle around a passive vanadium e-fuel stack. We combined the stack and a battery with a mecanum platform. I owned the mechanical design and packaging and built the onboard autonomy, controls and browser interface. Oscar handled the fuel chemistry and Bijoy handled power electronics, including PCB and BMS. The project earned an A and the team won the Most Popular Solution Award. Use the project outcome as context. Spend the time on how the vehicle was integrated.\n\nSource material\nPolyU Vandi FYP portfolio and CV facts Vandi 20–30.",
    "sub": "PolyU interdisciplinary final-year project",
    "images": [
      {
        "src": "images/slide-04-1.webp",
        "fit": "cover",
        "alt": "Vandi physical vehicle on its tabletop road course",
        "caption": "Vandi on the physical test course"
      }
    ],
    "id": "vandi",
    "nav": "Vandi"
  },
  {
    "type": "columns",
    "title": "Fuel-cell packaging and assembly",
    "section": "VANDI  /  MECHANICAL DESIGN",
    "lead": "One SolidWorks assembly located the chassis, fuel-cell stack, electronics and sensors.",
    "notes": "6:00–8:00  |  2 minutes\n\nPoint to the trunk area on the CAD model, then show the corresponding physical assembly. The stack geometry was my mechanical responsibility. The constraints were keeping the stack sealed and accessible, dealing with electrolyte handling and corrosion risk, and fitting the package around the drivetrain, sensors and electronics. I could adjust geometry and fastening in CAD, but I had to agree on wiring and access with our electrical teammate and on wet-side details with our chemistry teammate. The resulting stack could be mounted, wired and demonstrated as part of the vehicle. If asked about power, describe the hybrid stack/battery architecture and leave electrical sizing to team attribution.\n\nSource material\nVandi process page, manufacturing section and Vandi CV facts 20–28.",
    "rows": [
      [
        "Vehicle layout",
        "I located the stack and electronics around a mecanum chassis and coordinated fabrication."
      ],
      [
        "Trunk integration",
        "Fastening, sealing, wiring access and service sequence drove the stack package."
      ]
    ],
    "sub": null,
    "images": [
      {
        "src": "images/slide-05-1.webp",
        "fit": "cover",
        "alt": "Vandi SolidWorks assembly",
        "caption": null
      },
      {
        "src": "images/slide-05-2.webp",
        "fit": "cover",
        "alt": "Fuel-cell stack in Vandi's trunk",
        "caption": null
      }
    ]
  },
  {
    "type": "split",
    "title": "Jetson Nano control stack",
    "section": "VANDI  /  ONBOARD SOFTWARE",
    "lead": "One launch script brought up eight onboard processes.",
    "notes": "8:00–11:00  |  3 minutes\n\nTrace one command from the browser to the onboard backend, then to the chassis. A single launch script started the stack so I had a repeatable demo configuration. On the way back the operator could inspect the camera, LiDAR and map streams. Explain that the SLAM map serves a different purpose from the current scan used by the clearance check. Explain that the serial fallback changes the delivery route. The normal command gate still applies before either transport. Optional clip. Play the first 10–15 seconds of the physical showcase to show browser voice control.\n\nSource material\nVandi portfolio process view and CV facts 13–16. Physical vehicle showcase https://zhao255.github.io/assets/projects/fuel-cell-car/vandi-showcase.mp4",
    "rows": [
      [
        "Sensing and mapping",
        "The camera and 2D LiDAR fed perception. SLAM Toolbox built the map."
      ],
      [
        "Browser-to-robot control",
        "A Flask backend handled voice, chat, teleop and autonomous commands."
      ],
      [
        "Driver interface",
        "ROS 2 /cmd_vel reached the chassis when available. Direct serial supported the demo fallback."
      ]
    ],
    "sub": null,
    "images": [
      {
        "src": "images/slide-06-1.webp",
        "fit": "contain",
        "alt": "Vandi’s onboard browser control interface",
        "caption": "Vandi’s physical vehicle showcase",
        "demo": {
          "src": "../assets/projects/fuel-cell-car/vandi-showcase.mp4",
          "label": "Vandi physical vehicle showcase",
          "duration": "0:44",
          "muted": false
        }
      }
    ]
  },
  {
    "type": "text-only",
    "title": "Which commands can move the car?",
    "section": "VANDI  /  MOTION CONTROL",
    "lead": "Normal drive requests pass through ownership and LiDAR clearance checks before reaching the chassis.",
    "notes": "11:00–14:00  |  3 minutes\n\nUse an example. The operator requests forward motion while the front sector has a near obstacle. The model can select the forward tool, but the normal drive command still goes through ownership and the deterministic clearance gate. At roughly 8 cm the forward request blocks under the prototype thresholds. When slowing, the steering floor preserved some ability to turn away. Compare a bad upstream prediction with a missing wall of defense. The current script has a 360-degree exception and reverse has no rear-clearance check, so this is prototype risk reduction. If asked what I would do first, route every motion request through one dispatcher, define scan-loss and reverse behavior, and test each source against clear, blocked and stale input.\n\nSource material\nVandiProcess.tsx, Decisions, and CV facts 01, 04, 15 and X02. The current decision log records the scripted 360° and reverse exceptions.",
    "rows": [
      [
        "One motion owner",
        "Teleop, chat and autonomy take turns. The language model requests a fixed tool action."
      ],
      [
        "Deterministic clearance gate",
        "Sector clearance selects clear, slow or blocked behavior. A stale scan has its own branch."
      ],
      [
        "Known exceptions",
        "The scripted 360° action bypasses the gate. Reverse lacks a rear-clearance check."
      ]
    ],
    "sub": "A shared dispatcher could close the spin bypass and add a rear-clearance check."
  },
  {
    "type": "split",
    "title": "Road signs and traffic lights",
    "section": "VANDI  /  PERCEPTION",
    "lead": "I trained a three-class YOLO11n sign detector on the Jetson Nano.",
    "notes": "14:00–16:00  |  2 minutes\n\nThe three trained classes were go straight, turn right and red light. The held-out split score is useful for comparing model iterations inside this dataset. It says little on its own about new lighting or new sites. I used an explicit color stage so I could inspect and tune its response without retraining the detector. If asked what test I would add, collect complete runs under several lighting conditions and hold out whole runs or setups. Split by condition before reporting confidence or miss rates.\n\nSource material\nVandi portfolio process view and CV facts 06–09.\nCamera frame from the physical Vandi showcase at 00:22.",
    "rows": [
      [
        "0.989 mAP50",
        "The detector reached this score on the project validation split."
      ],
      [
        "Two-stage light reading",
        "A detector locates the light. HSV features classify the color in the crop."
      ],
      [
        "Tuning on the physical lamp",
        "I exposed the masks and thresholds in a browser tool so I could inspect what the classifier saw."
      ]
    ],
    "sub": null,
    "images": [
      {
        "src": "images/slide-08-1.webp",
        "fit": "contain",
        "alt": "Onboard camera frame with a bounding box around the physical red traffic light",
        "caption": "Red-light detection from the physical car’s camera"
      }
    ]
  },
  {
    "type": "split",
    "title": "Route control in Isaac Lab",
    "section": "VANDI  /  ISAAC LAB",
    "lead": "A wheel-driven model tows a trolley through a simulated traffic course.",
    "notes": "16:00–19:00  |  3 minutes\n\nThis work is separate from the original physical demonstration. The simulated robot starts with a fixed route and navigates locally with a wheel-driven model. The camera decides when to leave each station. I required agreement across three out of four frames. At the stop line the cable and edge of the view made the learned light detector unreliable, so I added a classical check for a compact lit lens with a dark ring. It supplied both red and green at that position. That is a good example of using a simple rule when the miss is predictable and observable. Optional clip: show the red-to-green transition or the sideways park. The same story works with the two stills.\n\nSource material\nVandi remaster, isaac_lab/AUTONOMY.md and the Vandi process page. Simulation walkthrough: https://zhao255.github.io/assets/projects/fuel-cell-car/vandi-isaac-lab-v3.mp4",
    "rows": [
      [
        "Route and release conditions",
        "A fixed route provides the stations. Camera detections decide when each station can release."
      ],
      [
        "Local motion",
        "A learned policy outputs forward, sideways and turn commands between stations."
      ],
      [
        "Traffic light failure",
        "A cable and the image edge weakened the learned signal. A lit-lens check recovered the light reading."
      ]
    ],
    "sub": null,
    "images": [
      {
        "src": "images/slide-09-1.webp",
        "fit": "cover",
        "alt": "Simulated Vandi at a red traffic light",
        "caption": "Recorded Isaac Lab simulation run",
        "demo": {
          "src": "../assets/projects/fuel-cell-car/vandi-isaac-lab-v3.mp4",
          "label": "Vandi Isaac Lab route",
          "duration": "1:07",
          "muted": false
        }
      }
    ]
  },
  {
    "type": "split",
    "title": "What the route run demonstrated",
    "section": "VANDI  /  SIMULATION EVIDENCE",
    "lead": "One recorded Isaac Lab route completed in 66.65 seconds.",
    "notes": "19:00–21:00  |  2 minutes\n\nGive the audience a close-up of the finish. The sideways maneuver matters because the hitch and trailer count as part of the footprint. A center-point route check would miss a trailer crossing the boundary. The two boundary audits checked physics and rendered geometry. The 25 checks are applicable checks for one recorded run. They do not estimate a physical success rate. Before putting the policy on the car I would compare measured turning, lateral slip and braking with the model on a small test course. Transition: the next project had the same need to say exactly what a test established, with a tougher wheel-contact problem.\n\nThe clip replays the scans recorded in this run through the simulation’s own mapping code, beside the render. It is the simulation’s mapping, not SLAM Toolbox on the car.\n\nSource material\nVandiProcess.tsx, Isaac Lab results. Run traffic-demo-v3-001 in the Vandi remaster.",
    "rows": [
      [
        "25 of 25 applicable checks",
        "The scripted audit covered route behavior and the sideways-park gate."
      ],
      [
        "Footprint stayed within the course",
        "The boundary audit included the car, hitch, trolley and wheels."
      ],
      [
        "2 mm from the parking target",
        "The result belongs to this simulated run. Physical deployment of the learned policy remains open."
      ]
    ],
    "sub": null,
    "images": [
      {
        "src": "../assets/projects/fuel-cell-car/vandi-lidar-mapping-poster.jpg",
        "fit": "contain",
        "alt": "LiDAR occupancy map building beside the Isaac Sim render of the same run",
        "caption": "LiDAR map rebuilt from the same Isaac Lab run, with the render in sync",
        "demo": {
          "src": "../assets/projects/fuel-cell-car/vandi-lidar-mapping.mp4",
          "label": "Vandi LiDAR mapping in simulation",
          "duration": "0:27",
          "muted": true,
          "badge": "Isaac Lab"
        }
      }
    ]
  },
  {
    "id": "stairio-intro",
    "type": "stairio-intro",
    "section": "PART 2 / STAIRIO",
    "title": "Meet Stairio 360",
    "lead": "A handrail-mounted robot for stairwell inspection.",
    "sub": "Robotics Systems Engineer",
    "notes": "21:00–22:00  |  1 minute\n\nClick the robot or press Next to play the original Stairio product turn. As the text appears, explain why a fixed rail makes systematic capture possible. My work includes adapted CAD and testing, embedded interfaces, operator software and the Unreal software twin. The team leads the main mechanical design.",
    "nav": "Stairio"
  },
  {
    "id": "stairio-scene",
    "type": "stairio-scene",
    "section": "STAIRIO / INSPECTION SCENE",
    "title": "A stairwell inspection in 3D",
    "notes": "22:00–23:00  |  1 minute\n\nScroll through the floors and follow the robot along the handrail. Open a capture or finding to show how an operator goes from a location to visual evidence. The scene and 360° views are synthetic. Use Page Down to continue to the physical builds."
  },
  {
    "type": "columns",
    "title": "The rail is the robot’s track",
    "section": "STAIRIO  /  PHYSICAL HARDWARE",
    "lead": "The drive must keep camera coverage useful while clearing rail changes and supports.",
    "notes": "23:00–25:00  |  2 minutes\n\nPoint out the body, battery and rail. This is an unusual robot because the building supplies its track. Handrails vary in section, grade, corner radius and support geometry. A fixture directly under the rail may collide with something that passes the same rail in free space. My hardware contributions were modifications to parts of the team’s CAD for enclosure, mounts and packaging, and prototype test work. The next slides use selected R&D concepts and simulation records to show how those constraints changed the mechanism.\n\nSource material\nStairio portfolio field videos, project role and hardware notes.",
    "rows": [
      [
        "S1 in the stairwell",
        "The first model established the capture, screening and reporting workflow."
      ],
      [
        "Stairio 360 on the test rail",
        "Two cameras increase coverage. The battery and mounts affect balance and swept clearance."
      ]
    ],
    "sub": null,
    "images": [
      {
        "src": "images/slide-12-1.webp",
        "fit": "cover",
        "alt": "Original S1 in a stairwell",
        "caption": null,
        "demo": {
          "src": "../assets/projects/stairio/WhatsApp%20Video%202026-10-14%20at%2001.15.29.mp4",
          "label": "Stairio S1 stairwell demonstration",
          "duration": "0:20",
          "muted": true,
          "badge": "Field test"
        },
        "orientation": "portrait"
      },
      {
        "src": "images/slide-12-2.webp",
        "fit": "cover",
        "alt": "Stairio 360 on a physical test rail",
        "caption": null,
        "demo": {
          "src": "media/stairio-360.mp4",
          "label": "Stairio 360 test rail demonstration",
          "duration": "0:34",
          "muted": true,
          "badge": "Test rail"
        }
      }
    ],
    "id": "stairio-hardware"
  },
  {
    "id": "hanging-battery",
    "type": "columns",
    "title": "Stairio 360’s hanging-battery design",
    "section": "STAIRIO / HARDWARE ITERATION",
    "lead": "The selected layout suspends the battery below the rail-mounted camera and drive body.",
    "notes": "25:00–27:00  |  2 minutes\n\nStart with the physical photo. Point out the compact camera and drive body above the pack and how the hanger places the battery mass below the rail. This is the Stairio 360 packaging direction we chose. Play the eight-second comparison based on the corresponding native CAD in Isaac Sim. With drive continuing, the wheel moved inward. The zero-speed guard at 30° of wheel-centre orbit stopped travel. The model uses a straight rail without supports and estimated tyre contact. The next slide covers a separate sharp-corner study.\n\nSource material\nStairio physical prototype gallery. Stairio rail-only tilt diagnostic, corrected SI runs from 30 October 2026.",
    "rows": [
      [
        "Selected physical layout",
        "The hanging pack sits below the compact dual-camera head and rail drive."
      ],
      [
        "Isaac Sim tilt diagnostic",
        "The replay compares continued drive with a stop triggered at 30° of wheel-centre orbit."
      ]
    ],
    "sub": null,
    "images": [
      {
        "src": "../assets/projects/stairio/Image_20260910092639_38_444.jpg",
        "fit": "contain",
        "alt": "Physical Stairio 360 mounted on a handrail, with its battery hanging below the drive body",
        "caption": null
      },
      {
        "src": "images/stairio-hanging-battery-tilt.webp",
        "fit": "contain",
        "alt": "Rail-only Isaac Sim comparison showing the Stairio 360 hanging-battery design",
        "caption": null,
        "demo": {
          "src": "media/stairio-hanging-battery-tilt.mp4",
          "duration": "0:08",
          "label": "hanging-battery tilt diagnostic",
          "muted": true,
          "badge": "Isaac Sim"
        }
      }
    ]
  },
  {
    "type": "split",
    "title": "The sharp corner still jammed",
    "section": "STAIRIO  /  ISAAC SIM MECHANISM STUDIES",
    "lead": "In a separate sharp-corner study, the simulated mechanism still jammed after the rail mesh was repaired.",
    "notes": "27:00–29:00  |  2 minutes\n\nThe folded mitre mesh had to be repaired before interpreting contact. The corrected cases still stopped short. Later yaw-release trials pass two stationary holds and fail the three moving cases. A useful candidate needs both clean route completion and stable rail capture. The next three slides compare different ways to improve that, using archived Isaac Sim trials.",
    "rows": [
      [
        "Corrected mitre, same jam",
        "The leading followers loaded into the outgoing rail while the rear contacts stayed on the incoming rail."
      ],
      [
        "Later revision passed 2 stationary holds",
        "The yaw-release candidate held flat and vertical for 20 seconds each in the model."
      ],
      [
        "All 3 moving retest cases failed",
        "The right mitre stalled. The left mitre and vertical link ended in hardware contact."
      ]
    ],
    "sub": null,
    "images": [
      {
        "src": "images/slide-14-1.png",
        "fit": "contain",
        "alt": "Recorded travel in sharp-corner simulation with original and corrected meshes",
        "caption": "The curves level off before the corner, shown by the red line."
      }
    ]
  },
  {
    "id": "twin-pod",
    "title": "Twin-pod drive and trailer",
    "image": "stairio-twin-pod",
    "duration": "0:26",
    "lead": "Two powered pods distribute the load along the rail.",
    "rows": [
      [
        "What changed",
        "Split the drivetrain and payload across two linked pods."
      ],
      [
        "What worked",
        "Both directions passed on two surveyed rounded returns in Isaac Sim."
      ],
      [
        "What failed",
        "The sharp plan mitre lost capture. One other surveyed descent hit a baluster."
      ]
    ],
    "rationale": "Best footage for a realistic route and a sharp-corner counterexample.",
    "notes": "Play the first segment to show ascent and descent on one surveyed rounded return. The second segment shows a sharp plan mitre where both variants lose capture. The original study also records two clean directions on a second surveyed route and a baluster strike on another descent. A repeatable bench check needs body clearance around supports.",
    "type": "split",
    "section": "STAIRIO / HARDWARE ITERATION",
    "images": [
      {
        "src": "images/stairio-twin-pod.webp",
        "fit": "contain",
        "alt": "Isaac Sim replay of twin-pod drive and trailer",
        "caption": "Isaac Sim study replay",
        "demo": {
          "src": "media/stairio-twin-pod.mp4",
          "duration": "0:26",
          "label": "Twin-pod drive and trailer",
          "muted": true,
          "badge": "Isaac Sim"
        }
      }
    ]
  },
  {
    "id": "articulated",
    "title": "Articulated modules with telescopic links",
    "image": "stairio-articulated",
    "duration": "0:35",
    "lead": "Outside links help the rear module follow the head around a return.",
    "rows": [
      [
        "What changed",
        "Two articulated modules share steering. The rear wheel rolls freely."
      ],
      [
        "What improved",
        "A pre-positioned outside-link variant brought both modules through a rounded return."
      ],
      [
        "Acceptance finding",
        "Excessive roll and body contact still failed the clean-traversal checks."
      ]
    ],
    "rationale": "Shows why both modules and contact quality belong in the pass criterion.",
    "notes": "Show the comparison at the rounded return and point out that head arrival alone can conceal a stranded trailer. The example starts pre-positioned. Higher assumed tyre friction did not fix sharp mitres. Treat the clip as a replay of exploratory data and the result as a reason to qualify both modules jointly.",
    "type": "split",
    "section": "STAIRIO / HARDWARE ITERATION",
    "images": [
      {
        "src": "images/stairio-articulated.webp",
        "fit": "contain",
        "alt": "Isaac Sim replay of articulated modules with telescopic links",
        "caption": "Isaac Sim study replay",
        "demo": {
          "src": "media/stairio-articulated.mp4",
          "duration": "0:35",
          "label": "Articulated modules with telescopic links",
          "muted": true,
          "badge": "Isaac Sim"
        }
      }
    ]
  },
  {
    "id": "belt",
    "title": "Shared belt steering with spring yokes",
    "image": "stairio-belt",
    "duration": "0:25",
    "lead": "Two wheel yokes share steering. Passive springs let them deflect independently.",
    "rows": [
      [
        "What changed",
        "Compared rigid and compliant yokes with the same ideal shared transmission."
      ],
      [
        "What improved",
        "The spring version travelled farther into the rounded R50 elbow."
      ],
      [
        "What failed",
        "Both variants lost rail capture before completing the elbow and sharp mitres."
      ]
    ],
    "rationale": "A controlled comparison of compliance with the same transmission.",
    "notes": "These are wheel/support-only trials. Use the side-by-side native Isaac replay to isolate the spring change while holding the transmission model fixed. At the R50 elbow the spring case progressed farther before loss of capture, but neither completed. Physical belt elasticity and a full payload are outside this test.",
    "type": "split",
    "section": "STAIRIO / HARDWARE ITERATION",
    "images": [
      {
        "src": "images/stairio-belt.webp",
        "fit": "contain",
        "alt": "Isaac Sim replay of shared belt steering with spring yokes",
        "caption": "Isaac Sim study replay",
        "demo": {
          "src": "media/stairio-belt.mp4",
          "duration": "0:25",
          "label": "Shared belt steering with spring yokes",
          "muted": true,
          "badge": "Isaac Sim"
        }
      }
    ]
  },
  {
    "id": "stairio-reconstruction",
    "type": "reconstruction",
    "title": "From site photos to simulation",
    "section": "STAIRIO  /  FIELD RECONSTRUCTION",
    "lead": "Measurements and photos become simulation models.",
    "seconds": 75,
    "start": "ST-09",
    "rows": [
      [
        "Measure and photograph",
        "Clearance, rail diameter, height and length, plus photos of the rail."
      ],
      [
        "Reconstruct with visual AI",
        "Measurements set the scale; photos give the geometry."
      ],
      [
        "Review and simulate",
        "Checked, then used for robot, clearance and camera studies."
      ]
    ],
    "sites": [
      {
        "id": "ST-08",
        "name": "R core in PolyU",
        "photo": "../assets/projects/stairio-simulator/reconstruction/references/ST-08-01.jpg",
        "model": "../assets/projects/stairio-simulator/reconstruction/models/ST-08.glb",
        "mirrorX": false,
        "diameter": 42.1,
        "height": 81,
        "length": 96.5,
        "slope": 30
      },
      {
        "id": "ST-09",
        "name": "Y core in PolyU",
        "photo": "../assets/projects/stairio-simulator/reconstruction/references/ST-09-01.jpg",
        "model": "../assets/projects/stairio-simulator/reconstruction/models/ST-09.glb",
        "mirrorX": true,
        "diameter": 42.28,
        "height": 99,
        "length": 155,
        "slope": 33
      },
      {
        "id": "ST-10",
        "name": "H Zentre",
        "photo": "../assets/projects/stairio-simulator/reconstruction/references/ST-10-01.jpg",
        "model": "../assets/projects/stairio-simulator/reconstruction/models/ST-10.glb",
        "mirrorX": false,
        "diameter": 42.62,
        "height": 92,
        "length": 155,
        "slope": 38
      },
      {
        "id": "ST-15",
        "name": "MetroCity Phase 2",
        "photo": "../assets/projects/stairio-simulator/reconstruction/references/ST-15-01.jpg",
        "model": "../assets/projects/stairio-simulator/reconstruction/models/ST-15.glb",
        "mirrorX": false,
        "diameter": 47.34,
        "height": 91.2,
        "length": 216.6,
        "slope": 34
      },
      {
        "id": "ST-22",
        "name": "東廣場",
        "photo": "../assets/projects/stairio-simulator/reconstruction/references/ST-22-01.jpg",
        "model": "../assets/projects/stairio-simulator/reconstruction/models/ST-22.glb",
        "mirrorX": true,
        "diameter": 42.51,
        "height": 91,
        "length": 148,
        "slope": 37
      },
      {
        "id": "ST-23",
        "name": "駱駝漆大廈",
        "photo": "../assets/projects/stairio-simulator/reconstruction/references/ST-23-01.jpg",
        "model": "../assets/projects/stairio-simulator/reconstruction/models/ST-23.glb",
        "mirrorX": false,
        "diameter": 48.28,
        "height": 92,
        "length": 137,
        "slope": 39
      },
      {
        "id": "ST-25",
        "name": "威利廣場",
        "photo": "../assets/projects/stairio-simulator/reconstruction/references/ST-25-01.jpg",
        "model": "../assets/projects/stairio-simulator/reconstruction/models/ST-25.glb",
        "mirrorX": false,
        "diameter": 48.12,
        "height": 107,
        "length": 105,
        "slope": 39
      },
      {
        "id": "ST-29",
        "name": "Tko gateway",
        "photo": "../assets/projects/stairio-simulator/reconstruction/references/ST-29-01.jpg",
        "model": "../assets/projects/stairio-simulator/reconstruction/models/ST-29.glb",
        "mirrorX": true,
        "diameter": 48.28,
        "height": 93,
        "length": 129,
        "slope": 34
      }
    ],
    "sub": "Flight dimensions are as recorded; returns, landings and supports are partly estimated.",
    "notes": "This is how a real stairwell becomes something we can simulate. The site team measures the dimensions that need accuracy, which are clearance, rail diameter, rail height and length, and photographs the stairwell. Our visual AI combines the measurements with the images to recreate the stairwell model. Step through a few sites: the rail diameters run from about 42 to 48 mm and the slopes from 30 to 39 degrees, which is exactly the spread the clamp and drive have to cope with. Be clear about the limit: the recorded flight dimensions are kept, but returns, landings and support positions include estimated geometry, so anything accuracy-sensitive is verified on site before a result guides deployment.\n\nSource material\nStairio Simulator page: From site photos to simulation, and its field reconstruction records."
  },
  {
    "type": "split",
    "title": "How would you tell a jam from slip?",
    "section": "STAIRIO  /  BENCH TEST DISCUSSION",
    "lead": "Compare a sharp mitre and a rounded elbow at the same preload.",
    "notes": "33:00–34:00  |  1 minute\n\nGive the audience ten seconds to make a prediction. On the same fixture, keep rail diameter, surface, initial alignment, preload and command fixed. Use example signatures: wheel motion with little body travel suggests slip, while little wheel or body motion with high current suggests a sustained stall. A repeatable stop location plus visible contact supports a geometry obstruction. Current alone mixes motor, driver and load effects. If nobody answers, explain that the external position sensor is the one signal I would protect. One brief audience answer is enough at this point.\n\nSource material\nAdapted from the original Stairio briefing’s driving-effort exercise and public rail mechanics illustration.",
    "rows": [
      [
        "Watch the chassis",
        "Track body displacement from an external camera or position reference."
      ],
      [
        "Record the drive",
        "Synchronize wheel speed and motor current with the chassis measurement."
      ],
      [
        "Define a clean pass",
        "Full body clears the junction without unintended contact. Repeat from controlled starting conditions."
      ]
    ],
    "sub": null,
    "images": [
      {
        "src": "images/slide-15-1.webp",
        "fit": "contain",
        "alt": "Illustration of spring-linked wheels over a sharp corner and rounded elbow",
        "caption": "Sharp mitre on the left and rounded elbow on the right."
      }
    ]
  },
  {
    "id": "stairio-ansys",
    "type": "split",
    "title": "Where the casing’s air and heat go",
    "section": "STAIRIO  /  ANSYS CASING STUDY",
    "seconds": 75,
    "numbers": [
      [
        "SIDE-VENT INTAKE, SHELL FITTED",
        "≈ 47%",
        "Up from about 22% with the shell off."
      ],
      [
        "MEAN CAMERA SURFACE",
        "≈ 70 °C",
        "At an assumed 1 W load: an upper bound."
      ],
      [
        "CASING RESISTANCE AT 1 CFM",
        "4.27 → 4.51 Pa",
        "Open assembly to fitted shell, modelled."
      ]
    ],
    "images": [
      {
        "src": "../assets/projects/stairio-simulator/casing-airflow-thermal/report-assets/video-poster.png",
        "fit": "contain",
        "alt": "ANSYS Fluent pathlines through the Stairio casing toward the top exhaust fan",
        "caption": "Fluent pathlines toward the top fan, coloured by speed. Playback time is illustrative.",
        "demo": {
          "src": "../assets/projects/stairio-simulator/casing-airflow-thermal/stairio-fluent-airflow.mp4",
          "label": "Stairio casing airflow in ANSYS Fluent",
          "duration": "0:19",
          "muted": true,
          "badge": "ANSYS Fluent"
        }
      }
    ],
    "sub": "Assumed 1 CFM airflow, 6.75 W total heat and a 25 °C room. Temperatures are model estimates, not measurements.",
    "notes": "This is the casing cooling question: with the electronics packed into a 3D-printed shell, where does the air actually go and where does heat build up? I compared the open assembly with the side shell fitted in ANSYS Fluent 2025 R2, holding the top fan at an assumed 1 CFM so the intake paths are comparable. Fitting the shell moves the intake from the fan-side arch, about 66 percent when open, to the horizontal side vents, about 47 percent. Then I added an assumed 6.75 W across the motor, three boards and two cameras in a 25 degree room. The camera mounts are the hottest region, at about 70 degrees mean surface temperature. Be explicit about the limits: steady laminar CFD, relaxed residuals, no mesh-independence check, and no PLA conduction or radiation, so the camera figure is an upper bound and nothing here is a measurement. The next step would be thermocouples on the camera bosses to calibrate the model.\n\nSource material\nStairio Simulator page: ANSYS airflow and heat simulation."
  },
  {
    "type": "numbers",
    "title": "Live camera latency and recovery",
    "section": "STAIRIO  /  ON-ROBOT MEASUREMENT",
    "lead": "I timestamped capture on the Pi and JPEG decode at the receiver across both routes.",
    "notes": "34:00–36:00  |  2 minutes\n\nThe stream is a real-robot example. I timestamped source capture and compared that with receive and decode on the PC, correcting clock offset with minimum-round-trip exchanges. Clock uncertainty was about ±32 ms locally and ±127 ms on the cloud route. Talk about the silent stall separately from median latency. I added an acknowledgment timeout and a freshness timeout so the stream can recover when the session still appears alive. The short verification ran for 90 seconds with zero reconnects. I would use a longer fault-injection run to measure recovery under controlled interruptions.\n\nSource material\nStairio streaming study and latency-2026-09-19.json. Hardware stream baseline and verification runs.",
    "numbers": [
      [
        "LOCAL MEDIAN",
        "421 ms",
        "538 ms at P95 across 1,338 received frames."
      ],
      [
        "CLOUD MEDIAN",
        "591 ms",
        "774 ms at P95 across 1,215 received frames."
      ],
      [
        "RERUN RECONNECTS",
        "0",
        "A 90-second check after I added acknowledgment and freshness timeouts."
      ]
    ],
    "sub": "The baseline ran for about five minutes. The cloud path had one reconnect."
  },
  {
    "type": "split",
    "title": "The robot controller in a virtual stairwell",
    "section": "STAIRIO  /  UNREAL ENGINE SOFTWARE TWIN",
    "lead": "The V7 Python controller runs against virtual devices in Unreal Engine 5.",
    "notes": "36:00–38:00  |  2 minutes\n\nI built the Unreal software twin as its sole developer. I reused the real controller so I could test its existing assumptions and operator interfaces, rather than maintaining a second implementation. Virtual devices provide the same categories of input and output. The larger scene lets me test floor mapping, camera coverage and report workflows. A qualified physical route is a separate evidence level. The native Isaac mechanism tests answer a different question about whether assumed geometry and contact are plausible. Optional clip: show the operator and virtual robot running together or use the scene still.\n\nSource material\nPortfolio Stairio simulator case study and CV facts 26–37. Simulator walkthrough https://zhao255.github.io/assets/projects/stairio-simulator/explainer-hyperframes.mp4",
    "rows": [
      [
        "Reuse the controller",
        "Virtual CAN motor, IMU and camera interfaces preserve the software boundary."
      ],
      [
        "Exercise the full workflow",
        "I ran the control page, camera capture and inspection reports in the virtual stairwell."
      ],
      [
        "Compare evidence across tools",
        "Unreal exercises software and camera workflows. Isaac investigates contact. The bench checks physical behavior."
      ]
    ],
    "sub": null,
    "images": [
      {
        "src": "images/slide-17-1.webp",
        "fit": "contain",
        "alt": "Unreal Engine Stairio stairwell model with 20 floors",
        "caption": "Unreal software twin and operator walkthrough",
        "demo": {
          "src": "../assets/projects/stairio-simulator/explainer-hyperframes.mp4",
          "label": "Stairio Unreal software twin walkthrough",
          "duration": "2:28",
          "muted": false
        }
      }
    ]
  },
  {
    "type": "split",
    "title": "Inspection review and work orders",
    "section": "STAIRIO  /  OPERATOR SOFTWARE",
    "lead": "Operators review each finding before assigning it by building.",
    "notes": "38:00–40:00  |  2 minutes\n\nWalk through an example. The camera captures a stair flight. Image analysis suggests a finding, and the operator reviews the evidence. I built the assignment path that turns the reviewed finding into a work order. The assignable roster depends on building coverage. The mobile user can acknowledge the assignment and close it with a note. I also built PDF export and the dashboard design work. The system result I care about is that a robot capture can become an identifiable task a building team can finish.\n\nThe clip plays the end-to-end demonstration at double speed: the robot on the handrail, with its operator dashboard and camera view.\n\nSource material\nStairio portfolio operator section and CV facts 10–16.",
    "rows": [
      [
        "Capture and evidence",
        "The report keeps the image, finding and location together for review."
      ],
      [
        "Assignment",
        "I built one work order per finding and applied the building’s coverage rules to the roster."
      ],
      [
        "Field follow-up",
        "The mobile workflow supports acknowledgment and completion notes. Coverage changes are audited."
      ]
    ],
    "sub": null,
    "images": [
      {
        "src": "images/stairio-end-to-end.jpg",
        "fit": "contain",
        "alt": "Stairio 360 on a stairwell handrail with its operator dashboard",
        "caption": "End-to-end demonstration: robot, dashboard and camera view (2× speed)",
        "demo": {
          "src": "../assets/projects/stairio/Media1.mp4",
          "label": "Stairio 360 end-to-end demonstration",
          "duration": "1:28",
          "muted": true,
          "badge": "End to end",
          "rate": 2
        }
      }
    ]
  },
  {
    "id": "basketball",
    "nav": "Robot basketball",
    "type": "chapter",
    "title": "Robot basketball",
    "section": "PART 3  /  ROBOT BASKETBALL",
    "lead": "First place in the IC382 inter-departmental competition",
    "sub": "Team leader  ·  8-person team  ·  2024–25",
    "seconds": 60,
    "notes": "Robot basketball was the IC382 inter-departmental competition: two teams of three robots, 180 seconds, possession switching every 30 seconds. Our eight-person team had two ME, four EE and two PAED students, and we won first place. I led the team and designed the shooter and its placement in SolidWorks. The EE students built the YOLO detection, the controller and the electrical system, so credit them when the vision comes up.\n\nSource material\nPortfolio Robot Basketball page and the IC382 week-13 slides.",
    "images": [
      {
        "src": "../assets/projects/robot-basketball/demo2-poster.jpg",
        "fit": "cover",
        "alt": "The competition robot during hardware testing",
        "caption": "Hardware testing before the competition",
        "demo": {
          "src": "../assets/projects/robot-basketball/demo2.mp4",
          "label": "Robot basketball hardware test",
          "duration": "0:06",
          "muted": true,
          "badge": "Hardware test"
        }
      }
    ]
  },
  {
    "type": "columns",
    "title": "From spring cannon to roller shooter",
    "section": "BASKETBALL  /  MECHANISM",
    "lead": "The competition’s actuator limit decided the shooter.",
    "seconds": 90,
    "notes": "The semester-1 robot shot with a spring cannon. The trigger took five designs. The final one drew an extension spring back with a linear actuator and held about 120 N at 55 mm of pull with two servo flippers. We dropped it because the competition limited motors and linear actuators, and the spring system alone needed at least two. Semester 2 used a roller that pinches the ball against a curved hood, so roller speed is the only setting. That pivot is the decision to talk through.\n\nSource material\nPortfolio Robot Basketball page: Semester 1 and Semester 2 sections.",
    "rows": [
      [
        "Semester 1 · Spring cannon",
        "A linear actuator draws an extension spring back; two servo flippers hold about 120 N, then release."
      ],
      [
        "Semester 2 · Roller shooter",
        "A roller pinches the ball against a curved hood. One setting remains: roller speed."
      ]
    ],
    "images": [
      {
        "src": "../assets/projects/robot-basketball/first-prototype-cad.jpg",
        "fit": "contain",
        "alt": "The spring cannon on its WheelTec base in SolidWorks",
        "caption": null
      },
      {
        "src": "../assets/projects/robot-basketball/cad2-transparent.png",
        "fit": "contain",
        "alt": "The competition roller-shooter robot in SolidWorks",
        "caption": null
      }
    ],
    "sub": "The spring system alone needed two of the limited motors and actuators."
  },
  {
    "type": "split",
    "title": "Why the 36.9° barrel missed",
    "section": "BASKETBALL  /  2026 SIMULATION STUDY",
    "lead": "After the competition, I rebuilt both shooters from the team’s CAD in Isaac Sim.",
    "seconds": 60,
    "notes": "In 2026 I rebuilt both shooters in Isaac Sim from the team’s CAD. This is a follow-up study, not the competition robot. The clip shows why the CAD’s 36.9° barrel misses: from the cannon’s low launch point the ball arrives too flat. A 120 mm ball through a 230 mm rim needs a descent steeper than about 32°. At 60° it drops in. Ball mass and rim height are assumptions, so present this as a geometry check.\n\nSource material\nPortfolio Robot Basketball page: 2026 follow-up study.",
    "rows": [
      [
        "The constraint",
        "A 120 mm ball clears a 230 mm rim only when it descends steeper than about 32°."
      ],
      [
        "In the replay",
        "The 36.9° shot misses. The robot repositions, raises the barrel to 60°, reloads and scores."
      ],
      [
        "Scope",
        "Simulation only. The ball mass and rim height are assumptions."
      ]
    ],
    "images": [
      {
        "src": "../assets/projects/robot-basketball/remaster/cannon-continuous.jpg",
        "fit": "contain",
        "alt": "Isaac Sim replay of the spring cannon",
        "caption": "Isaac Sim replay, one continuous sequence",
        "demo": {
          "src": "../assets/projects/robot-basketball/remaster/cannon-continuous.mp4",
          "label": "Spring cannon Isaac Sim replay",
          "duration": "0:16",
          "muted": true,
          "badge": "Isaac Sim"
        }
      }
    ]
  },
  {
    "type": "flow",
    "title": "Stereo vision sets the roller speed",
    "section": "BASKETBALL  /  PERCEPTION TO ACTUATION",
    "lead": "Two simulated cameras measure the hoop; a small network picks the RPM.",
    "seconds": 60,
    "notes": "The roller study adds perception. Two parallel simulated cameras with a 60 mm baseline find the orange rim in both images, triangulate it from disparity and convert it to distance from the robot’s front edge. Across seven scenes from 0.6 to 2 m, mean absolute range error is 7.8 mm. That distance goes to a small network that selects the roller RPM. The competition robot used the team’s YOLO and ROS approach instead; this pipeline exists only in simulation.\n\nSource material\nPortfolio Robot Basketball page: stereo vision to roller speed.",
    "nodes": [
      {
        "label": "Stereo pair",
        "detail": "60 mm baseline"
      },
      {
        "label": "Rim disparity",
        "detail": "u_left − u_right"
      },
      {
        "label": "Distance",
        "detail": "Z = f · B / d",
        "tone": "emphasis"
      },
      {
        "label": "Network",
        "detail": "Distance → RPM"
      },
      {
        "label": "Roller",
        "detail": "Pinch against the hood"
      }
    ],
    "images": [
      {
        "src": "../assets/projects/robot-basketball/remaster/stereo-left.webp",
        "fit": "cover",
        "alt": "Left and right stereo-camera views of the hoop in Isaac Sim, with a divider to compare them",
        "caption": "Move across the image to compare the two cameras. The rim shifts by the disparity.",
        "compare": [
          {
            "src": "../assets/projects/robot-basketball/remaster/stereo-left.webp",
            "label": "Left camera"
          },
          {
            "src": "../assets/projects/robot-basketball/remaster/stereo-right.webp",
            "label": "Right camera"
          }
        ]
      }
    ],
    "numbers": [
      [
        "1 M TARGET",
        "0.997 m",
        "Measured from the image pair shown."
      ],
      [
        "MEAN RANGE ERROR",
        "7.8 mm",
        "Seven scenes from 0.6 to 2 m."
      ]
    ]
  },
  {
    "type": "bars",
    "title": "714 calibration shots, one small network",
    "section": "BASKETBALL  /  ISAAC LAB",
    "lead": "Every checkpoint faces the same 512 held-out shots with 3 cm of distance noise.",
    "seconds": 60,
    "notes": "I ran 714 calibration shots in Isaac Lab and picked a scoring roller speed at seven distances from 0.5 to 2 m. A small network learned distance to RPM from those targets, with 3 cm of Gaussian noise on the distance. All four checkpoints face the same 512 held-out cases. The final checkpoint scores 82 percent. The early checkpoint is worse than the untrained one, which is why I evaluate on a fixed set instead of trusting a training curve. These are simulated results.\n\nSource material\nPortfolio Robot Basketball page: supervised calibration in Isaac Lab.",
    "bars": [
      [
        "Untrained",
        "0 updates",
        33.2
      ],
      [
        "Early",
        "5 updates",
        28.9
      ],
      [
        "Intermediate",
        "15 updates",
        67.2
      ],
      [
        "Final",
        "120 updates",
        82
      ]
    ],
    "images": [
      {
        "src": "../assets/projects/robot-basketball/remaster/roller-training-stages.jpg",
        "fit": "contain",
        "alt": "Isaac Sim roller shooter at untrained, intermediate and trained checkpoints",
        "caption": "Untrained, intermediate and trained shots at 1, 1.5 and 2 m",
        "demo": {
          "src": "../assets/projects/robot-basketball/remaster/roller-training-stages.mp4",
          "label": "Roller policy training stages",
          "duration": "0:27",
          "muted": true,
          "badge": "Isaac Lab"
        }
      }
    ],
    "sub": "Simulated results. Ball, rim and roller parameters are assumptions."
  },
  {
    "id": "stairio-hr",
    "nav": "Stairio HR",
    "type": "chapter",
    "title": "Stairio HR",
    "section": "PART 4  /  STAIRIO HR",
    "lead": "AI hiring, sized to the company",
    "sub": "Sole developer  ·  2026",
    "seconds": 45,
    "notes": "Stairio HR is a software project I built alone for Stairio. The idea is to fit AI to the size of the company: a small team needs the administration taken off its hands; a recruiting team needs a better way to find people. Team is in daily use at Stairio. Enterprise is a working prototype.\n\nSource material\nPortfolio Stairio HR page.",
    "images": [
      {
        "src": "../assets/projects/stairio-hr/workspace-replica.png",
        "fit": "contain",
        "alt": "Stairio HR applicant review workspace with fictional applicants",
        "caption": "The staff workspace, shown with fictional applicants"
      }
    ]
  },
  {
    "type": "cards",
    "title": "One principle, two solutions",
    "section": "STAIRIO HR  /  PRODUCT",
    "lead": "A small team needs time back. A recruiting team needs a better way to find people.",
    "seconds": 75,
    "notes": "Team is for a company without an HR department. It gathers applications from job boards and the Stairio ATS site, sends each role’s task automatically and books interviews. Enterprise turns a recruiter’s brief into filters they can inspect and edit, with saved searches, shortlists and company-scoped access. Same principle, different bottleneck.\n\nSource material\nPortfolio Stairio HR page: two solutions.",
    "cards": [
      {
        "tag": "01 / TEAM",
        "status": "In use at Stairio",
        "title": "Stairio HR · Team",
        "audience": "For small companies without an HR department",
        "items": [
          "AI-assisted replies and invitation drafts",
          "One inbox for applicants, tasks and interviews",
          "A private candidate journey from assessment to review"
        ]
      },
      {
        "tag": "02 / ENTERPRISE",
        "status": "Working prototype",
        "title": "Stairio HR · Enterprise",
        "audience": "For larger companies with dedicated recruiters",
        "items": [
          "Natural-language briefs become editable filters",
          "Candidate search, saved searches and shortlists",
          "Company-scoped access and subscription controls"
        ]
      }
    ]
  },
  {
    "type": "flow",
    "title": "Team: hiring without an HR department",
    "section": "STAIRIO HR  /  IN USE AT STAIRIO",
    "lead": "Automation handles the administration. People make every decision.",
    "seconds": 75,
    "notes": "This is Team end to end. An application arrives and its messages and CV are grouped under one person. The role’s task email goes out within about a minute, interviews book a Zoom link automatically, and the candidate gets one private link. Staff make every decision. The numbers come from Stairio’s workspace. Each delivery is claimed in the database before it is sent, so a crash can’t send the same task twice; an uncertain send goes to a person to check.\n\nSource material\nPortfolio Stairio HR page: result, how it runs and send-once delivery.",
    "nodes": [
      {
        "label": "Application",
        "detail": "Job boards and ATS site"
      },
      {
        "label": "One record",
        "detail": "Grouped by person",
        "tone": "emphasis"
      },
      {
        "label": "Task email",
        "detail": "Sent within a minute"
      },
      {
        "label": "Interview",
        "detail": "Calendar and Zoom"
      },
      {
        "label": "Decision",
        "detail": "Made by staff",
        "tone": "human"
      }
    ],
    "numbers": [
      [
        "APPLICANTS",
        "147",
        "137 with a CV or documents on file."
      ],
      [
        "EMAILS",
        "653",
        "Grouped by person, not by thread."
      ],
      [
        "ASSESSMENTS",
        "79",
        "41 completed on the Stairio ATS site."
      ],
      [
        "AUTOMATIC TASKS",
        "24",
        "Sent with no failed deliveries."
      ]
    ]
  },
  {
    "type": "split",
    "title": "Enterprise: a brief you can inspect",
    "section": "STAIRIO HR  /  ENTERPRISE PROTOTYPE",
    "lead": "The model proposes the filters. The recruiter checks them.",
    "seconds": 75,
    "notes": "Play part of the feature tour if time allows; it runs 81 seconds. A model translates the brief into a strict filter schema, and validation runs before the database search. Unsupported requirements are shown rather than dropped. It’s a working prototype on Next.js, Supabase and PostgreSQL with fictional candidates. SSO, ATS integrations and rollout would be scoped with the company.\n\nSource material\nPortfolio Stairio HR page: Enterprise architecture and feature tour.",
    "rows": [
      [
        "Brief to criteria",
        "Strict model output, checked against the dataset’s vocabulary before any search runs."
      ],
      [
        "Reusable work",
        "Saved searches and shortlists, kept separate for each company by row-level security."
      ],
      [
        "What stays human",
        "Recruiters review the criteria, choose candidates and make the hiring decisions."
      ]
    ],
    "images": [
      {
        "src": "../assets/projects/stairio-hr/enterprise-walkthrough-poster.jpg?v=site-voice-20261026",
        "fit": "contain",
        "alt": "Stairio HR Enterprise reviewing a recruiter’s brief as editable filters",
        "caption": "Feature tour with fictional candidates",
        "demo": {
          "src": "../assets/projects/stairio-hr/enterprise-walkthrough.mp4?v=site-voice-20261026",
          "captions": "../assets/projects/stairio-hr/enterprise-walkthrough.vtt?v=site-voice-20261026",
          "label": "Stairio HR Enterprise feature tour",
          "duration": "1:21",
          "muted": false
        }
      }
    ]
  },
  {
    "type": "columns",
    "title": "Other technical projects",
    "section": "HONORABLE MENTIONS",
    "lead": null,
    "notes": "40:00–43:00  |  3 minutes\n\nGive each project about a minute. The spoiler shows staged actuation and design trade-offs: driving a link from the grounded side made mounting simpler and output motion less linear. The robot arm shows kinematic reasoning: solve for joint angles, check the result with forward kinematics, and examine it in simulation. The auto shooter is an earlier camera-guided robot: HSV target detection on a Raspberry Pi, servo aiming and PI tuning. Use these as examples of breadth and keep the detailed questions for the discussion.\n\nSource material\nPortfolio project pages and Robotics and Mechanical CV variants.",
    "rows": [
      [
        "Active car spoiler",
        "I built a six-link mechanism and five-position ESP32-C3 control, with an ANSYS airflow study."
      ],
      [
        "5-DOF robot arm",
        "I implemented forward and inverse kinematics and explored the arm’s motion in simulation."
      ],
      [
        "Auto shooter robot",
        "I connected OpenCV target detection to servo aiming on a Raspberry Pi and tuned the aiming loop."
      ]
    ],
    "sub": null,
    "images": [
      {
        "src": "../assets/projects/car-spoiler-ops/project-operation-poster.jpg",
        "fit": "cover",
        "alt": "Active spoiler moving through its stages",
        "caption": null,
        "demo": {
          "src": "../assets/projects/car-spoiler-ops/project-operation.mp4",
          "label": "Active spoiler operation",
          "duration": "0:20",
          "muted": true,
          "badge": "Hardware"
        }
      },
      {
        "src": "../assets/projects/robot-arm-fk-ik/remaster/isaac-pick.jpg",
        "fit": "cover",
        "alt": "Five-axis robot arm picking an object in Isaac Sim",
        "caption": null,
        "demo": {
          "src": "../assets/projects/robot-arm-fk-ik/remaster/isaac-pick.mp4",
          "label": "Robot arm pick in Isaac Sim",
          "duration": "0:10",
          "muted": true,
          "badge": "Isaac Sim"
        }
      },
      {
        "src": "../assets/projects/auto-shooter-raspberry-pi/demo-poster.jpg",
        "fit": "cover",
        "alt": "Auto shooter robot aiming at a target",
        "caption": null,
        "demo": {
          "src": "../assets/projects/auto-shooter-raspberry-pi/demo.mp4",
          "label": "Auto shooter demonstration",
          "duration": "0:09",
          "muted": true,
          "badge": "Hardware"
        }
      }
    ],
    "id": "other-work",
    "nav": "Other work",
    "tech": [
      "spoiler",
      "arm",
      "shooter"
    ]
  },
  {
    "type": "text-only",
    "title": "Take-home evaluation",
    "section": "CLOSE",
    "lead": "I’d scope the task around one engineering decision and a way to test it.",
    "notes": "43:00–45:00  |  2 minutes\n\nSay what a deliverable would look like: one working artifact, a short record of the trade-off, and a repeatable check with the limitations made explicit. If they ask which of the three I’d choose, use what you learned in the interview and pick the one closest to the team’s work. My strongest examples today are the mechanism and test reasoning paired with software that can be exercised end-to-end. Finish at 45 minutes and leave the remaining time for the role discussion.",
    "rows": [
      [
        "Mechanism and test design",
        "Compare design revisions against clearance, load or repeatability criteria."
      ],
      [
        "Embedded autonomy",
        "Build a control or perception feature and exercise its fault paths."
      ],
      [
        "Simulation and validation",
        "Build a reproducible model and compare its behavior with a reference or measurement."
      ]
    ],
    "sub": "Thank you. I’m happy to discuss the role and the team’s work.",
    "tech": [],
    "id": "close"
  }
];
