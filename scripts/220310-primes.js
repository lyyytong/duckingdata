async function drawHistogram() {
  const dataset = await d3.csv("data/220310-primes/histogram.csv", d3.autoType);

  const chart = d3.select("#chart1");

  const width = d3.min([+chart.style("width").slice(0, -2), 600]);
  let dimensions = {
    width: width,
    height: width * 0.7,
    margins: {
      top: 20,
      right: 15,
      bottom: 20,
      left: 15,
    },
  };
  dimensions.boundedWidth =
    dimensions.width - dimensions.margins.left - dimensions.margins.right;
  dimensions.boundedHeight =
    dimensions.height - dimensions.margins.top - dimensions.margins.bottom;

  const wrapper = d3
    .select("#chart1")
    .append("svg")
    .attr("width", dimensions.width)
    .attr("height", dimensions.height)

  const bounds = wrapper.append("g").style(
    "transform",
    `translate(
            ${dimensions.margins.left}px,
            ${dimensions.margins.top}px
        )`
  );

  const xScale = d3
    .scaleLinear()
    .domain([d3.min(dataset, (d) => d.start), d3.max(dataset, (d) => d.stop)])
    .range([0, dimensions.boundedWidth])
    .nice();

  const maxCount = d3.max(dataset, (d) => d.count);
  const minCount = d3.min(dataset, (d) => d.count);
  const yScale = d3
    .scaleLinear()
    .domain([0, maxCount])
    .range([dimensions.boundedHeight, 0])
    .nice();

  const histBars = bounds
    .append("g")
    .selectAll("rect")
    .data(dataset)
    .enter()
    .append("rect")
    .attr("class", "bar")
    .attr("x", (d) => xScale(d.start))
    .attr("y", (d) => yScale(d.count))
    .attr("width", (d) => xScale(d.stop - d.start))
    .attr("height", (d) => dimensions.boundedHeight - yScale(d.count));

  const xAxis = bounds
    .append("g")
    .style("transform", `translateY(${dimensions.boundedHeight}px)`);
  xAxis
    .append("line")
    .attr("x1", 0)
    .attr("y1", 0)
    .attr("x2", dimensions.boundedWidth)
    .attr("y2", 0);
  xAxis
    .append("text")
    .attr("class", "small-text baseline-hanging")
    .text("0")
    .attr("y", 5);
  xAxis
    .append("text")
    .attr("class", "small-text baseline-hanging align-right")
    .text("1 billion")
    .attr("x", dimensions.boundedWidth)
    .attr("y", 5);

  const yAxis = bounds.append("g");
  yAxis
    .append("text")
    .attr("class", "small-text align-middle")
    .text("Prime count")
    .style("transform", "rotate(-90deg)")
    .attr("x", -dimensions.boundedHeight / 2)
    .attr("y", -10);
  yAxis
    .append("text")
    .attr("class", "small-text align-right")
    .text(d3.format(",")(yScale.domain()[0]))
    .attr("x", -3)
    .attr("y", dimensions.boundedHeight);

  const annotations = bounds.append("g");
  annotations
    .append("text")
    .attr("class", "small-text")
    .text(`${d3.format(",.2f")(maxCount / 1000000)} million`)
    .attr("x", 0)
    .attr("y", yScale(maxCount) - 10);
  annotations
    .append("text")
    .attr("class", "small-text align-right")
    .text(`${d3.format(",.2f")(minCount / 1000000)} million`)
    .attr("x", dimensions.boundedWidth)
    .attr("y", yScale(minCount) - 10);
  annotations
    .append("line")
    .attr("class", "annotation-line-pop")
    .attr("x1", 0.5)
    .attr("y1", yScale(maxCount) + 1)
    .attr("x2", dimensions.boundedWidth / 30 - 0.5)
    .attr("y2", yScale(maxCount) + 1);
  annotations
    .append("line")
    .attr("class", "annotation-line-pop")
    .attr("x1", dimensions.boundedWidth - dimensions.boundedWidth / 30 + 0.5)
    .attr("y1", yScale(minCount) + 1)
    .attr("x2", dimensions.boundedWidth - 0.5)
    .attr("y2", yScale(minCount) + 1);

  histBars.on("mouseenter", onMouseEnter).on("mouseleave", onMouseLeave);
  const tooltip = d3.select("#chart1 .tooltip");
  function onMouseEnter() {
    const rect = d3.select(this).style("opacity", .8);
    const datum = rect.datum();

    tooltip.select(".number").text(`${d3.format(",")(datum.count)} primes`);
    tooltip
      .select(".start")
      .text(d3.format(",")(datum.start == 2 ? 0 : datum.start + 1));
    tooltip
      .select(".stop")
      .text(d3.format(",")(datum.stop == 999999936 ? 1000000000 : datum.stop));

    let x = xScale((datum.start + datum.stop) / 2) + dimensions.margins.left;
    let y = yScale(datum.count) + dimensions.margins.top;

    const tooltipWidth = +tooltip.style("width").slice(0, -2);
    const tooltipHeight = +tooltip.style('height').slice(0, -2)
    const leftPos = -tooltipWidth / 2 + x;
    const topPos = -tooltipHeight-8 + y

    tooltip.style("opacity", 1);
    if (leftPos >= 0 && topPos >= 0) {
      tooltip
        .classed("bottom-pointer", true)
        .classed("side-pointer", false)
        .style(
          "transform",
          `translate(
                    calc(-50% + ${x}px),
                    calc(-100% + ${y - 8}px)
                )`
        );
    } else {
      x = xScale(datum.stop) + dimensions.margins.left;
      y = dimensions.boundedHeight / 2;
      tooltip
        .classed("bottom-pointer", false)
        .classed("side-pointer", true)
        .style(
          "transform",
          `translate(
                    calc(${x + 8}px),
                    calc(-50% + ${y}px)
                )`
        );
    }
  }
  function onMouseLeave() {
    tooltip.style("opacity", 0);
    d3.select(this).style("opacity", 0.2);
  }
}
drawHistogram();

// ✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎
// ✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎
// ✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎

async function drawHeatmap() {
  const dataset = await d3.csv(
    "data/220310-primes/digit_count.csv",
    d3.autoType
  );

  const chart = d3.select("#chart2");

  const width = d3.max([600, +chart.style("width").slice(0, -2)]);
  if (width == 600)
    chart.classed("chart-narrow", false).classed("chart-mobile", true);

  const height = d3.min([width, 700]);
  let dimensions = {
    width: width,
    height: height,
    margins: {
      top: 80,
      right: 180,
      bottom: 200,
      left: 65,
    },
  };
  dimensions.boundedWidth =
    dimensions.width - dimensions.margins.left - dimensions.margins.right;
  dimensions.boundedHeight =
    dimensions.height - dimensions.margins.top - dimensions.margins.bottom;

  const wrapper = chart
    .append("svg")
    .attr("width", dimensions.width)
    .attr("height", dimensions.height);

  const bounds = wrapper.append("g").style(
    "transform",
    `translate(
            ${dimensions.margins.left}px,
            ${dimensions.margins.top}px
        )`
  );

  const digits = dataset.map((d) => d.digit);
  const placeValues = Object.keys(dataset[0]).filter((d) => d != "digit");

  const xScale = d3
    .scaleBand()
    .domain(placeValues)
    .range([dimensions.boundedWidth, 0]);
  const yScale = d3
    .scaleBand()
    .domain(digits)
    .range([0, dimensions.boundedHeight]);
  const rectWidth = xScale.bandwidth();
  const rectHeight = yScale.bandwidth();

  const values = dataset.map(({ digit, ...placeValues }) =>
    Object.values({ ...placeValues })
  );
  const colorScale = d3
    .scaleLinear()
    .domain(d3.extent(d3.merge(values)))
    .range(["#f2f2f2", "#7a7ae6"]);
  digits.forEach((digit) => {
    const data = dataset.filter((d) => d.digit == digit)[0];
    bounds
      .append("g")
      .selectAll("rect")
      .data(placeValues)
      .enter()
      .append("rect")
      .attr("class", (d) => `heat-rect digit-${digit} position-${d}`)
      .attr("x", (d) => xScale(d))
      .attr("y", yScale(digit))
      .attr("width", rectWidth)
      .attr("height", rectHeight)
      .style("fill", (d) => colorScale(data[d]));
    bounds
      .append("g")
      .selectAll("text")
      .data(placeValues)
      .enter()
      .append("text")
      .attr("class", (d) => `small-text heat-text digit-${digit} position-${d}`)
      .attr("x", (d) => xScale(d) + rectWidth / 2)
      .attr("y", yScale(digit) + rectHeight / 2)
      .text((d) => d3.format(",.2f")(data[d] / 1000000))
      .style("font-size", width < 420 ? "11px" : "13px")
      .style("fill", (d) => (data[d] < 10 ? "gainsboro" : "#f2f2f2"));
  });

  const axes = bounds.append("g").attr("class", "axes");

  const annotationPos =
    dimensions.boundedWidth + dimensions.margins.right * 0.2;

  axes
    .append("text")
    .text("Number of occurences (in millions)")
    .attr("class", "small-text baseline-above align-right")
    .attr("x", annotationPos + 25)
    .attr("y", -50);
  axes
    .append("path")
    .attr("class", "annotation-line-dotted")
    .attr("d", () => {
      const line = d3.line();
      const xPos = annotationPos - 5;
      const xPos2 = dimensions.boundedWidth;
      const topYPos = -43;
      const bottomYPos = rectHeight * 1.5;
      const points = [
        [xPos, topYPos],
        [xPos, bottomYPos],
        [xPos2, bottomYPos],
      ];
      return line(points);
    });

  axes
    .append("text")
    .attr("class", "small-text")
    .text("Primes (except 2 & 5)")
    .attr("x", annotationPos)
    .attr("y", yScale(5) + rectHeight * 0.05);
  axes
    .append("text")
    .attr("class", "small-text")
    .text("cannot end with 5")
    .attr("x", annotationPos)
    .attr("y", yScale(5) + rectHeight * 0.5);
  axes
    .append("text")
    .attr("class", "small-text")
    .text("or even digits")
    .attr("x", annotationPos)
    .attr("y", yScale(5) + rectHeight * 0.95);
  axes
    .append("line")
    .attr("class", "annotation-line-dotted")
    .attr("x1", dimensions.boundedWidth)
    .attr("x2", annotationPos - 5)
    .style("transform", `translateY(${yScale(5) + rectHeight / 2}px)`);
  axes
    .append("line")
    .attr("class", "annotation-line-dotted")
    .attr("y1", yScale(4) + 6)
    .attr("y2", yScale(7) - 6)
    .style("transform", `translateX(${dimensions.boundedWidth}px)`);

  const digitAxis = axes.append("g");
  digitAxis
    .selectAll(".digit")
    .data(digits)
    .enter()
    .append("text")
    .attr("class", (d) => `small-text align-right digit-${d}`)
    .attr("x", -10)
    .attr("y", (d) => yScale(d) + rectHeight / 2)
    .text((d) => d);
  digitAxis
    .selectAll(".digit-rect")
    .data(digits)
    .enter()
    .append("rect")
    .attr("class", "digit-rect")
    .attr("x", -dimensions.margins.left)
    .attr("y", (d) => yScale(d))
    .attr("width", dimensions.margins.left)
    .attr("height", rectHeight);
  digitAxis
    .append("line")
    .attr("x1", 0)
    .attr("x2", 0)
    .attr("y1", 0)
    .attr("y2", dimensions.boundedHeight);
  digitAxis
    .append("text")
    .attr("class", "small-text align-left")
    .text("Digit")
    .attr("x", -dimensions.margins.left)
    .attr("y", rectHeight / 2);

  const positionAxis = axes.append("g");
  positionAxis
    .selectAll(".position")
    .data(placeValues)
    .enter()
    .append("text")
    .attr("class", (d) => `small-text baseline-above position-${d}`)
    .attr("x", (d) => xScale(d) + rectWidth / 2)
    .attr("y", -10)
    .text((d) => d);
  positionAxis
    .append("line")
    .attr("x1", -dimensions.margins.left)
    .attr("x2", dimensions.boundedWidth)
    .attr("y1", 0)
    .attr("y2", 0);
  positionAxis
    .append("text")
    .attr("class", "small-text baseline-above align-left")
    .text("Position")
    .attr("x", -dimensions.margins.left)
    .attr("y", -10);

  const legends = bounds
    .append("g")
    .style("transform", `translateY(${dimensions.boundedHeight}px)`);

  const placeValueNames = {
    1: "ones",
    2: "tens",
    3: "hundreds",
    4: "thousands",
    5: "10 thousands",
    6: "100 thousands",
    7: "millions",
    8: "10 millions",
    9: "100 millions",
  };
  const textWidth = 280;
  const leftDistance = (dimensions.boundedWidth - textWidth) / 2;

  const demoTextScale = d3
    .scaleBand()
    .domain(placeValues)
    .range([leftDistance + textWidth, leftDistance]);
  const digitWidth = demoTextScale.bandwidth();

  const textPos = dimensions.margins.bottom*.35;
  legends
    .selectAll(".demo-digit")
    .data(placeValues)
    .enter()
    .append("text")
    .attr("class", (d) => `demo-digit position-${d}`)
    .text("0")
    .attr("x", (d, i) =>
      i % 3 == 0
        ? demoTextScale(d) + digitWidth / 2 - 7
        : +d % 3 == 0
        ? demoTextScale(d) + digitWidth / 2 + 7
        : demoTextScale(d) + digitWidth / 2
    )
    .attr("y", textPos);
  legends
    .append("text")
    .attr("class", "demo-digit")
    .text("1")
    .attr("x", leftDistance - 7)
    .attr("y", textPos)
    .style("text-anchor", "end");
  for (const i of d3.range(3))
    legends
      .append("text")
      .attr("class", "demo-digit")
      .text(",")
      .attr("x", leftDistance + i * digitWidth * 3)
      .attr("y", textPos);

  const curve = d3.line().curve(d3.curveBundle.beta(0.9));
  legends
    .selectAll("path")
    .data(placeValues)
    .enter()
    .append("path")
    .attr("class", (d) => `demo-line annotation-line-dotted position-${d}`)
    .attr("d", (d, i) => {
      const topXPos = xScale(d) + rectWidth / 2;
      const bottomXPos =
        i % 3 == 0
          ? demoTextScale(d) + digitWidth / 2 - 7
          : +d % 3 == 0
          ? demoTextScale(d) + digitWidth / 2 + 7
          : demoTextScale(d) + digitWidth / 2;
      const topYPos = 0;
      const bottomYPos = textPos - 8;
      const midTopYPos =
        i == 0 || i == 8
          ? bottomYPos * 0.2
          : i == 2 || i == 6
          ? bottomYPos * 0.1
          : bottomYPos * 0.15;
      const midBottomYPos = bottomYPos * 0.7;
      const path = [
        [topXPos, topYPos],
        [topXPos, midTopYPos],
        [bottomXPos, midBottomYPos],
        [bottomXPos, bottomYPos],
      ];
      return curve(path);
    });
  legends
    .selectAll(".demo-position")
    .data(placeValues)
    .enter()
    .append("text")
    .attr("class", "small-text demo-position")
    .text((d) => d)
    .attr("x", (d, i) =>
      i % 3 == 0
        ? demoTextScale(d) + digitWidth / 2 - 7
        : +d % 3 == 0
        ? demoTextScale(d) + digitWidth / 2 + 7
        : demoTextScale(d) + digitWidth / 2
    )
    .attr("y", textPos - 2);
  legends
    .selectAll(".demo-position-text")
    .data(placeValues)
    .enter()
    .append("text")
    .attr("class", "small-text demo-position-text")
    .text((d) => placeValueNames[d])
    .attr("y", (d, i) =>
      i % 3 == 0
        ? demoTextScale(d) + digitWidth / 2 - 7
        : +d % 3 == 0
        ? demoTextScale(d) + digitWidth / 2 + 7
        : demoTextScale(d) + digitWidth / 2
    )
    .attr("x", -textPos - 35);

  d3.selectAll(".heat-rect")
    .on("mouseenter", rectOnMouseEnter)
    .on("mouseleave", rectOnMouseLeave);

  const tooltip = d3.select("#chart2 .tooltip");
  function rectOnMouseEnter() {
    const rect = d3.select(this);
    const digit = +rect
      .attr("class")
      .split(" ")
      .filter((d) => d.includes("digit"))[0]
      .slice(-1);
    const position = rect.datum();
    const count = dataset.filter((d) => d.digit == digit)[0][position];

    bounds
      .append("rect")
      .attr("class", "hover-rect")
      .attr("x", xScale(position))
      .attr("y", yScale(digit))
      .attr("width", rectWidth)
      .attr("height", rectHeight);

    const x = xScale(position) + rectWidth / 2 + dimensions.margins.left;
    const y = yScale(digit) + dimensions.margins.top;

    tooltip.style("opacity", 1);
    tooltip.classed("bottom-pointer", true).classed("side-pointer", false);
    tooltip.style("align-items", "center");

    tooltip.select(".digit").text(digit);
    tooltip.select(".position").text(placeValueNames[position]);
    tooltip.select(".position-sub-text").text("in the");
    tooltip.select(".count").text(d3.format(",")(count));
    tooltip.style(
      "transform",
      `translate(
            calc(-50% + ${x}px),
            calc(-100% + ${y - 5}px)
        )`
    );
  }
  function rectOnMouseLeave() {
    d3.select(".hover-rect").remove();
    tooltip.style("opacity", 0);
  }

  const digitRects = d3
    .selectAll(".digit-rect")
    .on("mouseenter", digitOnMouseEnter)
    .on("mouseleave", digitOnMouseLeave);
  function digitOnMouseEnter() {
    const digit = d3.select(this).datum();
    const data = dataset.filter((d) => d.digit == digit)[0];
    const { digitNum, ...positions } = data;
    const total = d3.sum(Object.values(positions));

    bounds
      .append("rect")
      .attr("class", "hightlight-rect")
      .attr("x", 0)
      .attr("y", yScale(digit))
      .attr("width", dimensions.boundedWidth)
      .attr("height", rectHeight);

    tooltip.style("opacity", 1);
    tooltip.classed("bottom-pointer", false).classed("side-pointer", true);
    tooltip.style("align-items", "start");

    tooltip.select(".digit").text(digit);
    tooltip
      .select(".position-container")
        .style('display', 'none')
    tooltip.select(".position-sub-text").text("in total");
    tooltip.select(".count").text(d3.format(",")(total));

    const x = dimensions.boundedWidth + dimensions.margins.left;
    const y = dimensions.margins.top + yScale(digit) + rectHeight / 2;
    tooltip.style(
      "transform",
      `translate(
            ${x + 8}px,
            calc(-50% + ${y}px)
        )`
    );
  }
  function digitOnMouseLeave() {
    d3.select(".hightlight-rect").remove();
    tooltip.style("opacity", 0);
    tooltip
      .select(".position-container")
    .style('display', 'inline')
  }
}
drawHeatmap();

// ✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎
// ✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎
// ✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎✳︎

async function drawBars() {
  const dataset = await d3.csv("data/220310-primes/patterns.csv", d3.autoType);

  const chart = d3.select("#chart3");

  const width = +chart.style("width").slice(0, -2);
  let dimensions = {
    width: width,
    height: width * 0.5,
    margins: {
      top: 0,
      right: 0,
      bottom: 0,
      left: 65,
    },
  };
  dimensions.boundedWidth =
    dimensions.width - dimensions.margins.left - dimensions.margins.right;
  dimensions.boundedHeight =
    dimensions.height - dimensions.margins.top - dimensions.margins.bottom;

  const wrapper = chart
    .append("svg")
    .attr("width", dimensions.width)
    .attr("height", dimensions.height);

  const bounds = wrapper.append("g").style(
    "transform",
    `translate(
            ${dimensions.margins.left}px,
            ${dimensions.margins.top}px
        )`
  );

  const xScale = d3
    .scaleLinear()
    .domain([0, 5000000])
    .range([0, dimensions.boundedWidth])
    .clamp(true);
  const yScale = d3
    .scaleBand()
    .domain(dataset.map((d) => d.pattern))
    .range([0, dimensions.boundedHeight])
    .paddingInner(0.2);
  const rectHeight = yScale.bandwidth();

  const toZoom = ["Six", "Seven", "Eight"];
  const bars = bounds
    .append("g")
    .selectAll("rect")
    .data(dataset)
    .enter()
    .append("rect")
    .attr("class", (d) =>
      toZoom.some((string) => d.pattern.includes(string))
        ? `bar to-zoom`
        : `bar no-zoom`
    )
    .attr("x", 0)
    .attr("y", (d) => yScale(d.pattern))
    .attr("width", (d) => (d.count < 2000 ? 2 : xScale(d.count)))
    .attr("height", rectHeight);

  const xAxis = bounds.append("g");
  xAxis
    .append("text")
    .text(0)
    .attr("class", "tiny-text baseline-above align-middle")
    .attr("x", 0)
    .attr("y", -5);
  xAxis
    .append("text")
    .text("5 million")
    .attr("class", "tiny-text baseline-above align-right x-max")
    .attr("x", dimensions.boundedWidth)
    .attr("y", -5);

  const yAxis = bounds.append("g");
  yAxis
    .selectAll("text")
    .data(dataset)
    .enter()
    .append("text")
    .attr("class", "small-text align-right")
    .attr("x", -10)
    .attr("y", (d) => yScale(d.pattern) + rectHeight / 2)
    .text((d) => d.pattern);
  yAxis
    .append("line")
    .attr("y1", 0)
    .attr("y2", dimensions.boundedHeight)
    .style("transform", `translateX(${0}px)`);

  const milMarks = bounds.append("g");
  milMarks
    .selectAll("text")
    .data(d3.range(5))
    .enter()
    .append("text")
    .attr("class", "million-marks")
    .attr("x", (d) => dimensions.boundedWidth - 5 + d * rectHeight * 0.5)
    .attr("y", yScale("Pair") + rectHeight / 2)
    .text("✧")
    .style("font-size", `${rectHeight}px`);
  const milMarksWidth = milMarks.node().getBoundingClientRect().width;
  bounds
    .append("rect")
    .attr("class", "lighten-mask")
    .attr("x", dimensions.boundedWidth + milMarksWidth - 12)
    .attr("y", yScale("Pair"))
    .attr("width", 8)
    .attr("height", rectHeight);
  const counts = bounds
    .append("g")
    .selectAll("text")
    .data(dataset)
    .enter()
    .append("text")
    .attr("class", (d) =>
      toZoom.some((string) => d.pattern.includes(string))
        ? `tiny-text to-zoom`
        : `tiny-text no-zoom`
    )
    .attr("x", (d) =>
      d.pattern == "Pair"
        ? dimensions.boundedWidth + milMarksWidth - 2
        : xScale(d.count) + 3
    )
    .attr("y", (d) => yScale(d.pattern) + rectHeight / 2)
    .text((d) => d3.format(",")(d.count));

  const examples = bounds
    .append("g")
    .selectAll("text")
    .data(dataset)
    .enter()
    .append("text")
    .attr("class", "in-rect-text")
    .attr("x", 5)
    .attr("y", (d) => yScale(d.pattern) + rectHeight / 2)
    .text((d) => (d.example ? d.example.replaceAll("+", ",") : ""));

  const legends = bounds
    .append("g")
    .style("transform", `translateX(${dimensions.boundedWidth}px)`);

  const annotation = chart
    .append("text")
    .attr("class", "small-text floating-text")
    .text(
      "Patterns can be found in the middle of a long numbers, hence primes (which they themselves cannot be even) can include plenty of even patterns like 222,  888, or 9696."
    )
    .style("bottom", `${dimensions.margins.bottom + 5}px`)
    .style("left", `${dimensions.boundedWidth + dimensions.margins.left}px`)
    .style("width", `200px`);
  const annotationHeight = annotation.node().getBoundingClientRect().height;
  const annotationWidth = annotation.node().getBoundingClientRect().width;

  const legendPos = dimensions.boundedHeight - annotationHeight - 30;
  legends
    .append("text")
    .attr("class", "million-marks")
    .attr("x", -5)
    .attr("y", legendPos)
    .text("✧")
    .style("font-size", `${rectHeight}px`);
  legends
    .append("text")
    .attr("class", "small-text")
    .attr("x", 18)
    .attr("y", legendPos)
    .text("= 5 millions");
  legends
    .append("line")
    .attr("class", "annotation-line-dotted")
    .attr("x1", 0)
    .attr("x2", annotationWidth)
    .style(
      "transform",
      `translateY(${dimensions.boundedHeight - annotationHeight - 10}px)`
    );

  const zoomRect = bounds
    .append("rect")
    .attr("class", "zoom-rect")
    .attr("x", 0)
    .attr("y", yScale("Six of") - 3)
    .attr("width", 45)
    .attr("height", yScale("Eight of") - yScale("Six of") + rectHeight + 6);
  const zoomText = bounds
    .append("text")
    .attr("class", "zoom-rect-text tiny-text")
    .text("hover to zoom")
    .attr("x", 50)
    .attr("y", yScale("Seven of") + rectHeight / 2);
  zoomRect
    .on("mouseenter", zoomOnMouseEnter)
    .on("mouseleave", zoomOnMouseLeave);
  const barsToZoom = d3.selectAll(".bar.to-zoom");
  const barsOther = d3.selectAll(".bar.no-zoom");
  const textsToZoom = d3.selectAll("text.to-zoom");
  const textsOther = d3.selectAll("text.no-zoom");
  const xMax = d3.select(".x-max");
  function getTransition() {
    return d3.transition().duration(300).ease(d3.easePolyOut);
  }
  function zoomOnMouseEnter() {
    zoomText.style("opacity", 0);
    const zoomWidth = dimensions.boundedWidth - 2;
    const zoomXScale = d3.scaleLinear().domain([0, 2000]).range([0, zoomWidth]);

    zoomRect.attr("width", zoomWidth);
    barsToZoom.attr("width", (d) => zoomXScale(d.count)).style("opacity", 0.3);
    barsOther.style("fill", "silver");
    textsToZoom
      .transition(getTransition())
      .attr("x", (d) => zoomXScale(d.count) + 5);
    textsOther.style("opacity", 0.15);
    milMarks.style("opacity", 0.15);
    legends.style("opacity", 0.15);
    annotation.style("opacity", 0.15);
    xMax.text("2,000");
  }
  function zoomOnMouseLeave() {
    zoomText.style("opacity", 1);
    zoomRect.attr("width", 45);
    barsToZoom.attr("width", (d) => 2).style("opacity", 0.15);
    barsOther.style("fill", "blue");
    textsToZoom
      .transition(getTransition())
      .attr("x", (d) => xScale(d.count) + 5);
    textsOther.style("opacity", 1);
    milMarks.style("opacity", 1);
    legends.style("opacity", 1);
    annotation.style("opacity", 1);
    xMax.text("5 millions");
  }
}
drawBars();

async function showPrimes() {
  const dataset = await d3.csv("data/220310-primes/3mil-primes.csv");

  const binsCount = 300;
  const binLength = Math.round(dataset.length / binsCount);

  d3.select(".page-num").text(binsCount);

  let data = [];
  for (let i = 0; i < binsCount; i++) {
    let temparray = [];
    if (i == binsCount - 1) {
      tempArray = dataset.slice(i * binLength, -1);
    } else {
      tempArray = dataset.slice(i * binLength, (i + 1) * binLength);
    }
    data.push(tempArray);
  }

  const filter = d3.select("#filter-input").on("change", patternInputOnChange);
  let pattern = filter.property("value");

  function countPattern(pattern) {
    let patternCount = [];
    d3.range(binsCount).forEach((d) => {
      let tempObj = {};
      tempObj.pageIndex = d;
      tempObj.hasPattern = data[d].filter((p) =>
        p.prime.includes(pattern)
      ).length;
      patternCount.push(tempObj);
    });
    return patternCount;
  }
  let patternCount = countPattern(pattern);

  let max = d3.max(patternCount, (d) => d.hasPattern);
  const colorScale = d3
    .scaleLinear()
    .domain([0, max])
    .range(["#e0e0e0", "#0000d8"]);

  const primes = d3.select(".primes-wrapper");

  const pagesWrapper = d3.select(".pages").on("mouseleave", pagesOnMouseLeave);
  const pages = pagesWrapper
    .selectAll(".page")
    .data(patternCount)
    .join("div")
    .attr("class", "page")
    .text((d) => d.pageIndex + 1)
    .style("color", (d) => colorScale(d.hasPattern))
    .on("mouseenter", pageOnMouseEnter)
    .on("click", pageClick);

  const pageDesc = d3.select(".page-desc");

  function pageOnMouseEnter(event, datum, nodes) {
    const pageIndex = datum.pageIndex;
    const selected = data[pageIndex];
    const [min, max] = d3.extent(selected, (d) => +d.prime);

    pageDesc.style("visibility", "visible");
    pageDesc.select(".page-num").text(pageIndex + 1);
    pageDesc.select(".count").text(d3.format(",")(selected.length));
    pageDesc.select(".start").text(d3.format(",")(min));
    pageDesc.select(".stop").text(d3.format(",")(max));
    pageDesc.select(".has-pattern").text(d3.format(",")(datum.hasPattern));
    pageDesc.select(".pattern").text(pattern);
  }
  function pagesOnMouseLeave() {
    pageDesc.style("visibility", "hidden");
  }
  function pageClick(event, datum) {
    d3.selectAll(".page")
      .filter((d) => d != datum)
      .classed("page-selected", false)
      .style("color", (d) => colorScale(d.hasPattern));
    d3.select(this).classed("page-selected", true).style("color", "#f2f2f2");

    const pageIndex = datum.pageIndex;
    const selected = data[pageIndex];

    primes.style("display", "flex");
    primes.selectAll("text").remove();
    selected.forEach((d) => {
      primes
        .append("text")
        .text(d.prime.includes(pattern) ? d.prime : "🌱")
        .style("opacity", d.prime.includes(pattern) ? 1 : 0.2)
        .style("padding", d.prime.includes(pattern) ? "0 2px" : "0");
    });
  }

  function patternInputOnChange() {
    pattern = filter.property("value");
    patternCount = countPattern(pattern);
    max = d3.max(patternCount, (d) => d.hasPattern);
    const alert = d3.select(".primes-filter .alert");
    if (max != 0) {
      colorScale.domain([0, max]);
      pages
        .data(patternCount)
        .join("div")
        .style("color", (d) => colorScale(d.hasPattern))
        .style("pointer-events", "all");
      filter.style("color", "#222222").style("border-bottom-color", "#0000d8");
      alert.style("display", "none");
    } else {
      pages.style("color", "gainsboro").style("pointer-events", "none");
      filter.style("color", "#FE4A49").style("border-bottom-color", "#FE4A49");
      alert.style("display", "inline");
      alert
        .select(".alert-text")
        .text(
          pattern.includes("4")
            ? "Primes with 4 were excluded."
            : "No results found."
        );
    }
    pages.classed("page-selected", false);
    primes.style("display", "none");
  }
}
showPrimes();
