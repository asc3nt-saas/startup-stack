import type { GeneratedRoadmap } from "@/lib/data/types";

const q = (question: string, options: string[], answer: number, explanation: string) => ({
  question,
  options,
  answer,
  explanation,
});

/** Seeded in demo mode so the roadmap page has something to show right away. */
export const derivativesRoadmap: GeneratedRoadmap = {
  title: "Derivatives: from limits to the chain rule",
  summary:
    "These lecture notes introduce the derivative as the instantaneous rate of change of a function. They start from the limit definition, build up the power, product and quotient rules, and finish with the chain rule and real-world rates of change such as velocity.",
  keyPoints: [
    "The derivative is the slope of the tangent line: the limit of (f(x+h) − f(x)) / h as h → 0.",
    "Power rule: d/dx xⁿ = n·xⁿ⁻¹.",
    "Product rule: (fg)′ = f′g + fg′. Quotient rule: (f/g)′ = (f′g − fg′) / g².",
    "Chain rule: d/dx f(g(x)) = f′(g(x))·g′(x).",
    "Velocity is the derivative of position; acceleration is the derivative of velocity.",
  ],
  cards: [
    { front: "Limit definition of the derivative", back: "f′(x) = lim h→0 of (f(x+h) − f(x)) / h" },
    { front: "Power rule", back: "d/dx xⁿ = n·xⁿ⁻¹" },
    { front: "Product rule", back: "(fg)′ = f′g + fg′" },
    { front: "Quotient rule", back: "(f/g)′ = (f′g − fg′) / g²" },
    { front: "Chain rule", back: "d/dx f(g(x)) = f′(g(x))·g′(x)" },
    { front: "Derivative of sin x", back: "cos x" },
  ],
  lessons: [
    {
      title: "What is a derivative?",
      content:
        "A derivative measures how fast something changes at a single instant.\n\nPicture the graph of a function. Pick two points and draw a line through them: its slope is the **average** rate of change. Now slide the second point closer and closer to the first. The line turns into the **tangent line**, and its slope is the derivative.\n\n- Average rate: (f(b) − f(a)) / (b − a)\n- Instantaneous rate: the limit as the gap shrinks to zero\n- Notation: f′(x), dy/dx or d/dx f(x)",
      quiz: [
        q("The derivative at a point is the slope of the…", ["Secant line", "Tangent line", "x-axis", "Normal line"], 1, "As the two points merge, the secant line becomes the tangent line."),
        q("Which notation does NOT mean a derivative?", ["f′(x)", "dy/dx", "∫f(x)dx", "d/dx f(x)"], 2, "∫f(x)dx is an integral, the opposite operation."),
        q("If a car's position changes from 10 m to 40 m in 3 s, its average speed is…", ["10 m/s", "13.3 m/s", "30 m/s", "40 m/s"], 0, "(40 − 10) / 3 = 10 m/s."),
      ],
    },
    {
      title: "The limit definition",
      content:
        "Formally, the derivative is a limit:\n\n**f′(x) = lim h→0 of (f(x+h) − f(x)) / h**\n\nExample with f(x) = x²:\n\n- (x+h)² − x² = 2xh + h²\n- Divide by h: 2x + h\n- Let h → 0: **f′(x) = 2x**\n\nSo the slope of y = x² at x = 3 is 6.",
      quiz: [
        q("Using the limit definition, the derivative of x² is…", ["x", "2x", "x²", "2"], 1, "The h² term vanishes and 2xh / h = 2x."),
        q("What is the slope of y = x² at x = 3?", ["3", "6", "9", "2"], 1, "f′(3) = 2·3 = 6."),
        q("In the definition, h represents…", ["The height of the graph", "A tiny change in x", "The tangent line", "The y-intercept"], 1, "h is the gap between the two x-values, shrinking to zero."),
      ],
    },
    {
      title: "Power, sum and constant rules",
      content:
        "You rarely need the limit definition in practice. A few rules do most of the work.\n\n- **Power rule:** d/dx xⁿ = n·xⁿ⁻¹\n- **Constant rule:** the derivative of a constant is 0\n- **Constant multiple:** d/dx [c·f] = c·f′\n- **Sum rule:** differentiate term by term\n\nExample: d/dx (3x⁴ − 5x + 7) = 12x³ − 5.",
      quiz: [
        q("d/dx x⁵ =", ["5x⁴", "x⁴", "5x⁵", "4x⁵"], 0, "Bring the 5 down and subtract one from the power."),
        q("d/dx (3x⁴ − 5x + 7) =", ["12x³ − 5 + 7", "12x³ − 5", "3x³ − 5", "12x⁴ − 5x"], 1, "The constant 7 disappears."),
        q("The derivative of 42 is…", ["42", "1", "0", "42x"], 2, "A constant never changes, so its rate of change is 0."),
      ],
    },
    {
      title: "Product and quotient rules",
      content:
        "When two functions are multiplied or divided, use these rules.\n\n- **Product rule:** (fg)′ = f′g + fg′\n- **Quotient rule:** (f/g)′ = (f′g − fg′) / g²\n\nMemory trick for the quotient rule: \"low d-high minus high d-low, over the square of what's below\".\n\nExample: d/dx (x²·sin x) = 2x·sin x + x²·cos x.",
      quiz: [
        q("(fg)′ equals…", ["f′g′", "f′g + fg′", "f′g − fg′", "(f′g − fg′) / g²"], 1, "Differentiate each factor in turn and add."),
        q("In the quotient rule, the denominator is…", ["g", "f²", "g²", "f·g"], 2, "\"Over the square of what's below.\""),
        q("d/dx (x²·sin x) =", ["2x·cos x", "2x·sin x + x²·cos x", "x²·cos x", "2x + cos x"], 1, "f = x², g = sin x, so f′g + fg′."),
      ],
    },
    {
      title: "The chain rule",
      content:
        "The chain rule handles a function inside another function.\n\n**d/dx f(g(x)) = f′(g(x)) · g′(x)**\n\nDifferentiate the outside, keep the inside, then multiply by the derivative of the inside.\n\n- d/dx (3x + 1)⁵ = 5(3x + 1)⁴ · 3 = 15(3x + 1)⁴\n- d/dx sin(x²) = cos(x²) · 2x",
      quiz: [
        q("d/dx (3x + 1)⁵ =", ["5(3x + 1)⁴", "15(3x + 1)⁴", "(3x + 1)⁴", "15x⁴"], 1, "Don't forget to multiply by the inside's derivative, 3."),
        q("d/dx sin(x²) =", ["cos(x²)", "2x·cos(x²)", "cos(2x)", "2x·sin(x²)"], 1, "Outside: cos(x²). Inside: 2x."),
        q("The chain rule is used for…", ["Sums of functions", "Composite functions", "Constant functions", "Products only"], 1, "It applies when one function is nested in another."),
      ],
    },
    {
      title: "Rates of change in the real world",
      content:
        "Derivatives describe change everywhere.\n\n- **Velocity** is the derivative of position: v(t) = s′(t)\n- **Acceleration** is the derivative of velocity: a(t) = v′(t)\n- **Marginal cost** in economics is the derivative of total cost\n\nExample: if s(t) = 5t², then v(t) = 10t and a(t) = 10. At t = 2 s the object moves at 20 m/s.",
      quiz: [
        q("Velocity is the derivative of…", ["Acceleration", "Position", "Time", "Mass"], 1, "v(t) = s′(t)."),
        q("If s(t) = 5t², the velocity at t = 2 is…", ["10", "20", "5", "40"], 1, "v(t) = 10t, so v(2) = 20."),
        q("Acceleration is…", ["The derivative of velocity", "The integral of velocity", "Position divided by time", "Always zero"], 0, "a(t) = v′(t)."),
      ],
    },
  ],
};

/** Returned when no Gemini key is set, so the feature still demos end to end. */
export const sampleRoadmap: GeneratedRoadmap = {
  title: "Photosynthesis basics",
  summary:
    "Photosynthesis is how plants, algae and some bacteria turn light energy into chemical energy. Light reactions in the thylakoids make ATP and NADPH, and the Calvin cycle in the stroma uses them to build glucose from carbon dioxide.",
  keyPoints: [
    "Overall equation: 6CO₂ + 6H₂O + light → C₆H₁₂O₆ + 6O₂.",
    "It happens in chloroplasts; chlorophyll absorbs mostly red and blue light.",
    "Light-dependent reactions split water, release oxygen and make ATP and NADPH.",
    "The Calvin cycle fixes CO₂ into sugar using ATP and NADPH.",
  ],
  cards: [
    { front: "Where does photosynthesis happen?", back: "In the chloroplasts" },
    { front: "Overall equation of photosynthesis", back: "6CO₂ + 6H₂O + light → C₆H₁₂O₆ + 6O₂" },
    { front: "What do the light reactions produce?", back: "ATP, NADPH and oxygen" },
    { front: "What does the Calvin cycle make?", back: "Glucose (sugar) from CO₂" },
  ],
  lessons: [
    {
      title: "Why plants photosynthesise",
      content:
        "Plants can't eat, so they make their own food from light.\n\n**6CO₂ + 6H₂O + light → C₆H₁₂O₆ + 6O₂**\n\n- Inputs: carbon dioxide, water and light\n- Outputs: glucose and oxygen\n- The oxygen we breathe is a by-product",
      quiz: [
        q("Which gas do plants release during photosynthesis?", ["Carbon dioxide", "Nitrogen", "Oxygen", "Hydrogen"], 2, "Oxygen comes from splitting water."),
        q("Which is NOT an input of photosynthesis?", ["Light", "Water", "Glucose", "Carbon dioxide"], 2, "Glucose is the product."),
      ],
    },
    {
      title: "Chloroplasts and chlorophyll",
      content:
        "Photosynthesis takes place in **chloroplasts**.\n\n- **Thylakoids**: stacked membranes where light is captured\n- **Stroma**: the fluid around them where sugar is built\n- **Chlorophyll** absorbs red and blue light and reflects green, which is why leaves look green",
      quiz: [
        q("Why do leaves look green?", ["Chlorophyll absorbs green light", "Chlorophyll reflects green light", "Green light is the strongest", "Water is green"], 1, "Green light is reflected, not absorbed."),
        q("Where is light captured?", ["Stroma", "Nucleus", "Thylakoids", "Cell wall"], 2, "Thylakoid membranes hold the chlorophyll."),
      ],
    },
    {
      title: "The light reactions",
      content:
        "In the thylakoids, light energy is turned into chemical energy.\n\n- Water is split, releasing oxygen\n- Energy is stored in **ATP** and **NADPH**\n- These carriers move on to the Calvin cycle",
      quiz: [
        q("The light reactions produce…", ["Glucose", "ATP and NADPH", "Carbon dioxide", "Starch"], 1, "They make energy carriers, not sugar."),
        q("Splitting which molecule releases oxygen?", ["Glucose", "CO₂", "Water", "ATP"], 2, "H₂O is split in the light reactions."),
      ],
    },
    {
      title: "The Calvin cycle",
      content:
        "In the stroma, the Calvin cycle builds sugar.\n\n- The enzyme **RuBisCO** fixes CO₂ from the air\n- ATP and NADPH power the reactions\n- The result is glucose the plant uses for energy and growth",
      quiz: [
        q("Which enzyme fixes CO₂?", ["Amylase", "RuBisCO", "ATP synthase", "Lipase"], 1, "RuBisCO is the most abundant enzyme on Earth."),
        q("Where does the Calvin cycle happen?", ["Thylakoids", "Stroma", "Mitochondria", "Roots"], 1, "It runs in the fluid around the thylakoids."),
      ],
    },
  ],
};
