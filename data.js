/* ============================================================
   JEE360 — MASTER DATA FILE
   Single source of truth for all subjects, teachers, chapters
   and lecture data. All pages (planner, study-mode, dashboard)
   read from this file.

   FORMAT:
   chapters: [{ no, name, v, e, n, lectures? }]
     no = real chapter number in the batch
     v  = videos (lectures), e = exercises (DPPs), n = notes
     lectures (optional) = REAL per-lecture data:
       [{ t:"title", d:duration_in_minutes, date:"YYYY-MM-DD" }]
       When present, dashboard uses real titles & durations.
   Chapter ORDER in the array = priority / study order.

   lec  : total lecture hours for the subject (at 1x)
   prac : total DPP/practice hours for the subject
   estimated:true  -> counts are still estimates
   estimated:false -> real batch data (from PW THOR)
   ============================================================ */

window.JEE360_DATA = {
  batch: "PW THOR — 11th IIT Yatra",
  updated: "2026-09-01",

  subjects: {

    /* ============ PHYSICS — REAL DATA ✓ ============
       Source: batch page (265 videos, 147 exercises, 629 notes
       incl. sessions). Chapter list in PRIORITY ORDER as given.
       230 lecture videos + 141 chapter DPPs.
       Durations per lecture: pending (chapter-wise data aayega) */
    phy: {
      name: "Physics",
      teacher: "Saleem Ahmad Sir",
      estimated: false,
      durationsPending: true,
      lec: 288,   // ~230 lectures × ~75 min avg (until real durations arrive)
      prac: 94,   // ~141 DPPs × ~40 min avg
      chapters: [
        { no:1,  name:"Mathematical Tools",                  v:7,  e:6,  n:13,
          lectures: [
            { t:"Basic Mathematical Tool || NO DPP",  d:110, date:"2024-06-15" },
            { t:"Basic Maths, Vectors, Types Of Vector, Angle b/w Vector", d:127, date:"2024-06-16" },
            { t:"Triangle Law, Resultant Of Two Vectors", d:130, date:"2024-06-17" },
            { t:"Question Practice On Triangle Law, Parallelogram, Polygon Law, Position Vector, Unit Vector", d:124, date:"2024-06-18" },
            { t:"Application Of Unit Vector, Component Of Vector", d:130, date:"2024-06-20" },
            { t:"Dot Product & Application, Component Of One Vector Along Another Vector", d:146, date:"2024-06-22" },
            { t:"KPP 01 Discussion || Recorded", d:37, date:"2024-06-24" }
          ]
        },
        { no:2,  name:"Motion In Straight Line",             v:11, e:7,  n:19,
          lectures: [
            { t:"Distance, Displacement, Average Speed, Average Velocity, Instantaneous Speed || NO DPP", d:120, date:"2024-06-23" },
            { t:"Velocity, Acceleration, Differentiation || NO DPP", d:134, date:"2024-06-25" },
            { t:"Average Acceleration, Average Speed, Average Velocity, Graph", d:123, date:"2024-06-26" },
            { t:"Graph || Integration", d:119, date:"2024-06-27" },
            { t:"Extra Lecture : Integration, Differentiation, Max-Min || NO DPP", d:54, date:"2024-06-27" },
            { t:"Graph", d:133, date:"2024-06-29" },
            { t:"Graph Conversion", d:125, date:"2024-06-30" },
            { t:"Graph Conversion, Equation Of Motion", d:128, date:"2024-07-01" },
            { t:"Motion Under Gravity, Equation Of Motion", d:132, date:"2024-07-02" },
            { t:"Motion Under Gravity, Equation Of Motion (Part- 02)", d:126, date:"2024-07-03" },
            { t:"Motion Under Gravity, Projectile Motion || NO DPP", d:132, date:"2024-07-04" }
          ]
        },
        { no:3,  name:"Motion In A Plane",                   v:8,  e:8,  n:17 },
        { no:9,  name:"Oscillations",                        v:9,  e:7,  n:17 },
        { no:4,  name:"Laws Of Motion",                      v:13, e:8,  n:21 },
        { no:8,  name:"Rotational Motion",                   v:21, e:7,  n:35 },
        { no:5,  name:"Circular Motion",                     v:5,  e:4,  n:9  },
        { no:6,  name:"Work, Energy & Power",                v:10, e:7,  n:17 },
        { no:7,  name:"Centre of Mass & System of Particles",v:16, e:9,  n:26 },
        { no:10, name:"Kinetic Theory & Thermodynamics",     v:6,  e:6,  n:13 },
        { no:11, name:"Mechanical Properties of Solids",     v:1,  e:0,  n:1  },
        { no:12, name:"Thermal Properties of Matter",        v:12, e:7,  n:20 },
        { no:13, name:"Mechanical Properties of Fluids",     v:13, e:8,  n:21 },
        { no:14, name:"Waves",                               v:9,  e:6,  n:15 },
        { no:15, name:"Electric Charges & Fields",           v:17, e:11, n:28 },
        { no:16, name:"Modern Physics",                      v:7,  e:0,  n:14 },
        { no:17, name:"Current Electricity",                 v:7,  e:4,  n:13 },
        { no:18, name:"Capacitor",                           v:8,  e:5,  n:16 },
        { no:19, name:"Wave Optics",                         v:5,  e:0,  n:13 },
        { no:20, name:"Gravitation",                         v:2,  e:3,  n:5  },
        { no:21, name:"Magnetism",                           v:9,  e:7,  n:16 },
        { no:22, name:"Electromagnetic Wave",                v:2,  e:0,  n:2  },
        { no:23, name:"Semiconductor",                       v:3,  e:0,  n:3  },
        { no:24, name:"Electromagnetic Induction",           v:6,  e:6,  n:12 },
        { no:25, name:"Error & Measurement",                 v:3,  e:0,  n:3  },
        { no:26, name:"Alternating Current",                 v:5,  e:6,  n:11 },
        { no:27, name:"Ray Optics",                          v:14, e:9,  n:23 },
        { no:28, name:"Unit & Dimension",                    v:1,  e:0,  n:1  }
      ],
      /* extra non-chapter sections in the batch (not scheduled) */
      extras: [
        { name:"Advance Session",                    v:6,  e:0, n:7  },
        { name:"KPP By Saleem Sir",                  v:4,  e:0, n:22 },
        { name:"Interaction Session By Saleem Sir",  v:11, e:0, n:4  },
        { name:"Revision",                           v:9,  e:0, n:9  },
        { name:"JEE Advanced Paper Discussion",      v:2,  e:0, n:2  },
        { name:"JEE Mains PYQ Discussion",           v:2,  e:0, n:4  },
        { name:"Important Talk Before Exam",         v:1,  e:0, n:0  },
        { name:"Practice Sheet",                     v:0,  e:6, n:6  },
        { name:"PYQ Practice Sheet (PDF)",           v:0,  e:0, n:30 },
        { name:"Mind Maps (PDF)",                    v:0,  e:0, n:25 },
        { name:"Short Notes (PDF)",                  v:0,  e:0, n:26 },
        { name:"Chapter Wise Handwritten Notes (PDF)",v:0, e:0, n:31 },
        { name:"Study Modules (PDF)",                v:0,  e:0, n:2  },
        { name:"Test Papers & Answer Keys (PDF)",    v:0,  e:0, n:29 },
        { name:"Standard Practice Sheet Manthan & Abhedya (PDF)", v:0, e:0, n:28 }
      ]
    },

    /* ============ PHYSICAL CHEMISTRY — estimates ============ */
    pc: {
      name: "Physical Chemistry",
      teacher: "Faisal Razaq Sir",
      estimated: true,
      lec: 85,
      prac: 45,
      chapters: [
        { no:1, name:"Mole Concept", v:5, e:5, n:0 },
        { no:2, name:"Atomic Structure", v:4, e:4, n:0 },
        { no:3, name:"Thermodynamics & Thermochemistry", v:5, e:5, n:0 },
        { no:4, name:"Chemical & Ionic Equilibrium", v:5, e:5, n:0 },
        { no:5, name:"Electrochemistry", v:4, e:4, n:0 },
        { no:6, name:"Chemical Kinetics", v:4, e:4, n:0 },
        { no:7, name:"Solutions & Solid State", v:4, e:4, n:0 }
      ]
    },

    /* ============ ORGANIC CHEMISTRY — REAL DATA ✓ ============
       Source: batch page (All Contents: 89 videos, 62 exercises,
       221 notes incl. extras). Chapters only:
       73 lecture videos + 62 chapter DPPs.
       Durations per lecture: pending */
    oc: {
      name: "Organic Chemistry",
      teacher: "Pankaj Sijariya Sir",
      estimated: false,
      durationsPending: true,
      lec: 91,   // ~73 lectures × ~75 min avg (until real durations arrive)
      prac: 41,  // ~62 DPPs × ~40 min avg
      chapters: [
        { no:1,  name:"Some Basic Principles and Techniques: IUPAC Nomenclature", v:5,  e:5,  n:10 },
        { no:2,  name:"Some Basic Principles and Techniques: Isomerism",          v:13, e:11, n:24 },
        { no:3,  name:"Some Basic Principles and Techniques: General Organic Chemistry", v:14, e:12, n:26 },
        { no:4,  name:"Reaction Mechanism",                                       v:23, e:20, n:43 },
        { no:5,  name:"Name Reactions",                                           v:7,  e:6,  n:13 },
        { no:6,  name:"Practical Organic Chemistry",                              v:4,  e:3,  n:7  },
        { no:7,  name:"Biomolecules",                                             v:3,  e:2,  n:5  },
        { no:8,  name:"Polymers",                                                 v:1,  e:1,  n:2  },
        { no:9,  name:"Environmental Chemistry",                                  v:1,  e:1,  n:2  },
        { no:10, name:"Chemistry in Everyday Life",                               v:2,  e:1,  n:3  }
      ]
    },

    /* ============ INORGANIC CHEMISTRY — REAL DATA ✓ ============
       Source: batch page (All Contents: 76 videos, 41 exercises,
       176 notes incl. extras). Chapters only, as requested:
       68 lecture videos + 41 chapter DPPs.
       Durations per lecture: pending */
    ioc: {
      name: "Inorganic Chemistry",
      teacher: "Kunwar Om Pandey Sir",
      estimated: false,
      durationsPending: true,
      lec: 85,   // ~68 lectures × ~75 min avg (until real durations arrive)
      prac: 27,  // ~41 DPPs × ~40 min avg
      chapters: [
        { no:1, name:"Periodic Table",                              v:10, e:9,  n:19 },
        { no:2, name:"Chemical Bonding",                            v:20, e:12, n:32 },
        { no:3, name:"Coordination Compounds",                      v:14, e:10, n:24 },
        { no:4, name:"P-block Elements",                            v:7,  e:0,  n:7  },
        { no:5, name:"The d and f-Block Elements",                  v:6,  e:4,  n:10 },
        { no:6, name:"Principles of Qualitative Analysis: Salt analysis", v:6, e:4, n:11 },
        { no:7, name:"Metallurgy",                                  v:1,  e:0,  n:1  },
        { no:8, name:"S Block",                                     v:3,  e:1,  n:4  },
        { no:9, name:"Hydrogen",                                    v:1,  e:1,  n:2  }
      ]
    },

    /* ============ MATHEMATICS — estimates ============ */
    math: {
      name: "Mathematics",
      teacher: "Sachin Jakhar Sir",
      estimated: true,
      lec: 240,
      prac: 120,
      chapters: [
        { no:1,  name:"Basic Maths & Quadratics", v:5, e:5, n:0 },
        { no:2,  name:"Sequence & Series", v:4, e:4, n:0 },
        { no:3,  name:"Trigonometry", v:5, e:5, n:0 },
        { no:4,  name:"Straight Lines & Circles", v:6, e:6, n:0 },
        { no:5,  name:"Conic Sections", v:5, e:5, n:0 },
        { no:6,  name:"Permutations & Probability", v:5, e:5, n:0 },
        { no:7,  name:"Matrices & Determinants", v:4, e:4, n:0 },
        { no:8,  name:"Limits, Continuity & Differentiability", v:6, e:6, n:0 },
        { no:9,  name:"Application of Derivatives", v:4, e:4, n:0 },
        { no:10, name:"Integration & AOI", v:6, e:6, n:0 },
        { no:11, name:"Vectors & 3D", v:5, e:5, n:0 }
      ]
    }
  }
};
