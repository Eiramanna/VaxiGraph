import {
  select,
  csv,
  scaleLinear,
  scaleTime,
  extent,
  min,
  max,
  axisLeft,
  axisRight,
  axisBottom,
  line,
  curveMonotoneX,
  format,
  easeLinear,
  color
} from 'd3';

import UIControls from './ui_controls';
import { COUNTRY_CODES_OBJ, COUNTRY_CODES_ARR } from './country_codes';

const receiveUserSelection = () => {
  document.getElementById('user-country-select')
    .addEventListener('change', handleChange);
}

let countryName;
let incidenceArr = [];
let coverageArr = [];
let countryIdx;
let titleText = 'Select a Country Below...';

const handleChange = e => {
  const countryCode = e.target.value;
  countryName = COUNTRY_CODES_OBJ[countryCode];
  countryIdx = COUNTRY_CODES_ARR.indexOf(countryCode)
  incidenceArr = [];
  coverageArr = [];
  loadData(countryIdx);
  d3.selectAll("svg > *").remove();
  titleText = `${ countryName } Polio Incidence`;
  render(incidenceArr);
  render(coverageArr);
}

const svg = select('svg');

const width = +svg.attr('width');
const height = +svg.attr('height');

const render = data => {
  // xValue is a function which extracts "year" from data
  const xValue = d => d.year;
  // xAxisLabel is the text for the axis label
  const xAxisLabel = 'Year';

  // y1Value is a function which extracts "incidence" from data
  const y1Value = d => d.incidence;

  const circleRadius = 4; // ?????
  // y1AxisLabel is the text for the axis label
  const y1AxisLabel = 'New Polio Cases';
  
  // y2Value is a function which extracts "coverage" from data
  const y2Value = d => d.coverage;
  // const circleRadius = 4;
  // y2AxisLabel is the text for the axis label
  const y2AxisLabel = 'Polio Vaccine Coverage';


  // these three just maths
  const margin = { top: 100, right: 200, bottom: 100, left: 200 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  // sets the scale of x axis to be linear representation of time
  const xScale = scaleTime()
    .domain(extent(data, xValue)) // sets observable values
    .range([0, innerWidth]) // sets the output range (pixels on screen)
    // .nice() // extend the domain to nice round numbers

  const y1Scale = scaleLinear()
    .domain([0, max(data, y1Value)])
    .range([innerHeight, 0])
    .nice()

  const y2Scale = scaleLinear()
    .domain([0, 100])
    .range([innerHeight, 0])
    .nice()

  // create g element with origin at the graph body (inside the margins)
  const g = svg.append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  // create a new bottom-oriented axis generator
  const xAxis = axisBottom(xScale)
    .tickSize(-innerHeight) // set the size of the ticks
    .tickPadding(15) // set the padding between ticks and labels
    .tickFormat(format("")) // set the tick format explicitly
    .ticks(9) // customize how ticks are generated and formatted

  const y1Axis = axisLeft(y1Scale)
    // .tickSize(-innerWidth) ticks are extended this far
    .tickPadding(15)

  const y2Axis = axisRight(y2Scale)
    .tickSize(innerWidth)
    .tickPadding(15)

  // creates a yAxis group where we append a g element
  const y1AxisG = g.append('g').call(y1Axis) // call .append on y1Axis
    .attr('class', 'testytesty')
  y1AxisG.selectAll('.domain').remove() // remove elements with class 'domain'

  // sets attributes on a new text element
  y1AxisG.append('text')
    .attr('class', 'axis-label')
    .attr('y', -100)
    .attr('x', -innerHeight / 2)
    .attr('fill', 'black')
    .attr('transform', `rotate(270)`)
    .attr('text-anchor', 'middle')
    .text(y1AxisLabel);

  const y2AxisG = g.append('g').call(y2Axis);
  // y2AxisG.selectAll('.domain').remove();

  y2AxisG.append('text')
    .attr('class', 'axis-label')
    .attr('y', -innerWidth - 80)
    .attr('x', innerHeight / 2)
    .attr('fill', 'black')
    .attr('transform', `rotate(90)`)
    .attr('text-anchor', 'middle')
    .text(y2AxisLabel);

  const xAxisG = g.append('g').call(xAxis)
    .attr('transform', `translate(0,${innerHeight})`);

  xAxisG.select('.domain').remove();

  xAxisG.append('text')
    .attr('class', 'axis-label')
    .attr('y', 65)
    .attr('x', innerWidth / 2)
    .attr('fill', 'black')
    .text(xAxisLabel);

  g.selectAll('.incidence-dot').data((data.every(d => d.incidence !== undefined) ? data : {}))
    .enter().append('circle')
      .attr('cy', d => y1Scale(y1Value(d)))
      .attr('cx', d => xScale(xValue(d)))
      // .attr('r', circleRadius)
      .attr('class', 'incidence-dot')

  g.selectAll('.coverage-dot').data((data.every(d => d.coverage !== undefined) ? data : {}))
    .enter().append('circle')
      .attr('cy', d => y2Scale(y2Value(d)))
      .attr('cx', d => xScale(xValue(d)))
      // .attr('r', circleRadius)
      .attr('class', 'coverage-dot')

  // creating line
  const y1LineGenerator = line()
    .x(d => xScale(xValue(d))) // set x accessor
    .y(d => y1Scale(y1Value(d))) // set y accessor
    .curve(curveMonotoneX)

  const y1Path = g.append('path')
    .attr('class', 'path graph-path incidence-path')
    .attr('d', y1LineGenerator(data))

  const totalLengthY1 = y1Path.node().getTotalLength();

  y1Path
    // sets length of dashes and makes line dashed
    // two lengths set (respectively) the dash length and space between dashes
    .attr("stroke-dasharray", totalLengthY1 + " " + totalLengthY1)
    // sets offset to where the first dash starts
    // (totalLength is at original ending)
    .attr("stroke-dashoffset", totalLengthY1)
    .transition()
      .duration(3000)
      // defaults to easeCubic
      // .ease(easeLinear) // describes speed of line drawing from beginning to end
      // sets the offset to 0 (via transition)
      .attr("stroke-dashoffset", 0);

  // creating line
  const y2LineGenerator = line()
    .x(d => xScale(xValue(d))) // set x accessor
    .y(d => y2Scale(y2Value(d))) // set y accessor
    .curve(curveMonotoneX)

  // actually draw lines
  const y2Path = g.append('path')
    .attr('class', 'path graph-path coverage-path')
    .attr('d', y2LineGenerator(data))
  
  const totalLengthY2 = y2Path.node().getTotalLength();

  y2Path
    .attr("stroke-dasharray", totalLengthY2 + " " + totalLengthY2)
    .attr("stroke-dashoffset", totalLengthY2)
    .transition()
      .duration(3000)
      // deafaults to easeCubic
      // .ease(easeLinear) // describes speed of line drawing from beginning to end
      .attr("stroke-dashoffset", 0);

//--------------------------mouseover line effect-----------------------------//
  const mouseG = g.append('g')
    .attr('class', 'mouse-over-effects');
  mouseG.append('path')
    .attr("class", "mouse-line")
    .style("stroke", "black")
    .style("stroke-width", "1px")
    .style("opacity", "0");

  let lines = document.getElementsByClassName('path');
  console.log(lines);

  const mousePerLine = mouseG.selectAll('.mouse-per-line')
    .data(data)
    .enter()
    .append("g")
    .attr("class", "mouse-per-line");
  
  mousePerLine.append('circle')
    .attr("r", 7)
    .style("stroke", d => {return color(d.name)})
    .style("fill", "none")
    .style("stroke-width", "1px")
    .style("opacity", "0");

  mousePerLine.append("text")
    .attr("transform", "translate(10,3)");

  mouseG.append('rect') // append a rect to catch mouse movements on canvas
    .attr('width', width) // can't catch mouse events on a g element
    .attr('height', height)
    .attr('fill', 'none')
    .attr('pointer-events', 'all')
    .on('mouseout', () => { // on mouse out hide line, circles and text
      d3.select(".mouse-line")
        .style("opacity", "0");
      d3.selectAll(".mouse-per-line circle")
        .style("opacity", "0");
      d3.selectAll(".mouse-per-line text")
        .style("opacity", "0");
    })
    .on('mouseover', () => { // on mouse in show line, circles and text
      d3.select(".mouse-line")
        .style("opacity", "1");
      d3.selectAll(".mouse-per-line circle")
        .style("opacity", "1");
      d3.selectAll(".mouse-per-line text")
        .style("opacity", "1");
    })
    .on('mousemove', () => { // mouse moving over canvas
      console.log(this)
      const mouse = d3.mouse(this);
      d3.select(".mouse-line")
        .attr("d", function () {
          const d = "M" + mouse[0] + "," + height;
          d += " " + mouse[0] + "," + 0;
          return d;
        });

      d3.selectAll(".mouse-per-line")
        .attr("transform", function (d, i) {
          console.log(width / mouse[0])
          const xDate = x.invert(mouse[0]),
            bisect = d3.bisector(d => { return d.year; }).right;
          idx = bisect(d.values, xDate);

          const beginning = 0,
            end = lines[i].getTotalLength(),
            target = null;

          while (true) {
            target = Math.floor((beginning + end) / 2);
            pos = lines[i].getPointAtLength(target);
            if ((target === end || target === beginning) && pos.x !== mouse[0]) {
              break;
            }
            if (pos.x > mouse[0]) end = target;
            else if (pos.x < mouse[0]) beginning = target;
            else break; //position found
          }

          d3.select(this).select('text')
            .text(y.invert(pos.y).toFixed(2));

          return "translate(" + mouse[0] + "," + pos.y + ")";
        });
      })

  // draw title
  g.append('text')
    .attr('class', 'title')
    .attr('y', -10)
    .text(titleText);
};

const loadData = countryIdx => {
  csv('../data/polio_incidence.csv')
    .then(data => {
      receiveUserSelection()
      const columns = Object.keys(data[countryIdx]);
      const countries = data.map(d => d.Cname);
      const years = columns.map(colHeader => {
        if (+colHeader) return +colHeader
      }).filter(
        header => typeof header === "number"
      )

      years.forEach(y => {
        const obj = {};
        obj.year = y;
        obj.incidence = +data[countryIdx][y];
        incidenceArr.push(obj)
      });

      render(incidenceArr);
    });

  csv('../data/polio_coverage_estimates.csv')
    .then(data => {
      const columns = Object.keys(data[countryIdx]);
      const countries = data.map(d => d.Cname);
      const years = columns.map(colHeader => {
        if (+colHeader) return +colHeader
      }).filter(
        header => typeof header === "number"
      )

      years.forEach(y => {
        const obj = {};
        obj.year = y;
        obj.coverage = +data[countryIdx][y];
        coverageArr.push(obj)
      })

      render(coverageArr);
    })
}

csv('../data/polio_incidence.csv')
  .then(data => {
    receiveUserSelection()
    const columns = Object.keys(data[0]);
    const countries = data.map(d => d.Cname);
    const years = columns.map(colHeader => {
      if (+colHeader) return +colHeader
    }).filter(
      header => typeof header === "number"
    )

    years.forEach(y => {
      const obj = {};
      obj.year = y;
      obj.incidence = +data[0][y];
      incidenceArr.push(obj)
    });

    render({});
  });

csv('../data/polio_coverage_estimates.csv')
  .then(data => {
    const columns = Object.keys(data[0]);
    const countries = data.map(d => d.Cname);
    const years = columns.map(colHeader => {
      if (+colHeader) return +colHeader
    }).filter(
      header => typeof header === "number"
    )

    years.forEach(y => {
      const obj = {};
      obj.year = y;
      obj.coverage = +data[0][y];
      coverageArr.push(obj)
    })

    render({});
  })