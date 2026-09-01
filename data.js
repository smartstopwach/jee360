/* ============================================================
   JEE360 — MASTER DATA FILE
   Single source of truth for all subjects, teachers, chapters
   and lecture data. All pages (planner, study-mode, dashboard)
   read from this file.

   HOW TO UPDATE WITH REAL BATCH DATA:
   - chapters: array of [ "Chapter Name", lectureCount ]
   - lec  : total lecture hours for the subject (at 1x)
   - prac : total DPP/practice hours for the subject
   - estimated:true means counts are estimates, waiting for
     the real lecture list from the batch.
   ============================================================ */

window.JEE360_DATA = {
  batch: "PW THOR — 11th IIT Yatra",
  updated: "2026-09-01",

  subjects: {

    phy: {
      name: "Physics",
      teacher: "Saleem Ahmad Sir",
      estimated: true,
      lec: 220,   // total lecture hours at 1x
      prac: 110,  // total DPP / practice hours
      chapters: [
        ["Units, Dimensions and Measurement", 4],
        ["Vectors & Kinematics", 6],
        ["Laws of Motion", 5],
        ["Work, Power & Energy", 4],
        ["Rotational Motion", 6],
        ["Gravitation", 3],
        ["Thermal Physics", 5],
        ["SHM & Waves", 5],
        ["Electrostatics", 6],
        ["Current Electricity", 5],
        ["Magnetism & EMI", 6],
        ["Optics", 5],
        ["Modern Physics", 5]
      ]
    },

    pc: {
      name: "Physical Chemistry",
      teacher: "Faisal Razaq Sir",
      estimated: true,
      lec: 85,
      prac: 45,
      chapters: [
        ["Mole Concept", 5],
        ["Atomic Structure", 4],
        ["Thermodynamics & Thermochemistry", 5],
        ["Chemical & Ionic Equilibrium", 5],
        ["Electrochemistry", 4],
        ["Chemical Kinetics", 4],
        ["Solutions & Solid State", 4]
      ]
    },

    oc: {
      name: "Organic Chemistry",
      teacher: "Pankaj Sijariya Sir",
      estimated: true,
      lec: 95,
      prac: 50,
      chapters: [
        ["GOC - 1 & 2", 6],
        ["Isomerism", 4],
        ["Hydrocarbons", 5],
        ["Haloalkanes & Haloarenes", 4],
        ["Alcohols, Phenols & Ethers", 4],
        ["Aldehydes, Ketones & Acids", 5],
        ["Amines & Biomolecules", 4]
      ]
    },

    ioc: {
      name: "Inorganic Chemistry",
      teacher: "Kunwar Om Pandey Sir",
      estimated: true,
      lec: 70,
      prac: 35,
      chapters: [
        ["Periodic Table & Properties", 4],
        ["Chemical Bonding", 6],
        ["p-Block Elements", 5],
        ["d & f Block", 3],
        ["Coordination Compounds", 5],
        ["Salt Analysis", 3]
      ]
    },

    math: {
      name: "Mathematics",
      teacher: "Sachin Jakhar Sir",
      estimated: true,
      lec: 240,
      prac: 120,
      chapters: [
        ["Basic Maths & Quadratics", 5],
        ["Sequence & Series", 4],
        ["Trigonometry", 5],
        ["Straight Lines & Circles", 6],
        ["Conic Sections", 5],
        ["Permutations & Probability", 5],
        ["Matrices & Determinants", 4],
        ["Limits, Continuity & Differentiability", 6],
        ["Application of Derivatives", 4],
        ["Integration & AOI", 6],
        ["Vectors & 3D", 5]
      ]
    }
  }
};
