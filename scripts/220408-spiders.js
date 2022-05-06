async function drawRadialChart() {
    const dataset = await d3.csv('data/220408-spiders/species.csv', d3.autoType)
    dataset.sort((a, b) => d3.ascending(a.year, b.year))

    const yearAccessor = d => d[0]
    const countAccessor = d => d[1]
    
    const years = Array.from(new Set(dataset.map(d => d.year)))
    const continents = ['Europe', 'Oceania', 'S-America','N-America', 'Africa', 'Asia']

    let continentsData = {
        sum: {},
        cumsum: {},
        // stacked: []
    }

    // years.forEach(year => continentsData.stacked.push({year: year}))
    continents.forEach(continent => {
        const data = d3.rollups(dataset, v => d3.sum(v, d => d[continent]), d => d.year)
        const maxSum = d3.max(data, countAccessor)
        continentsData.sum[continent] = data

        const cumsum = d3.cumsum(data, countAccessor)
        const maxCumsum = d3.max(cumsum)
        continentsData.cumsum[continent] = d3.zip(years, cumsum)
        // for (const i in d3.range(years.length)) {
        //     const obj = continentsData.stacked.filter(d => d.year==years[i])[0]
        //     obj[continent] = cumsum[i]
        // }
    })
    // const stack = d3.stack().keys(continents)
    // continentsData.stacked = stack(continentsData.stacked)
    
    const chart = d3.select('#chart1')
    const width = +chart.style('width').slice(0, -2)
    let dimensions = {
        width: width,
        height: width,
        radius: width/2,
        margins: {
            top: 0,
            right: 35,
            bottom: 0,
            left: 35
        }
    }
    dimensions.boundedWidth = dimensions.width - dimensions.margins.left - dimensions.margins.right
    dimensions.boundedHeight = dimensions.height - dimensions.margins.top - dimensions.margins.bottom
    dimensions.boundedRadius = dimensions.boundedWidth/2
    
    const defaultR = dimensions.boundedRadius
    const outRingOuterR = defaultR * .98
    const outRingInnerR = defaultR * .65
    const inRingOuterR = defaultR * .5
    const inRingInnerR = defaultR * 0
    const outRingInnerRExpanded = defaultR * .7
    const inRingOuterRExpanded = defaultR * .6
    const inRingInnerRExpanded = defaultR * 0.35
    const textMargin = 5

    const wrapper = chart.append('svg')
        .attr('width', dimensions.width)
        .attr('height', dimensions.height)
        // .style('background', 'yellow')
    const bounds = wrapper.append('g')
        .style('transform', `translate(
            ${dimensions.radius}px,
            ${dimensions.radius}px
        )`)

    const defs = wrapper.append('defs')
    const bgGradientID = 'bg-gradient'
    const bgGradient = defs.append('radialGradient')
        .attr('id', bgGradientID)
    const numStops = 10
    const stops = d3.range(numStops).map(num => num/(numStops-1))
    const gradientColorScale = d3.interpolatePurples
    stops.forEach(stop => {
        bgGradient.append('stop')
            .attr('offset', `${stop*100}%`)
            .attr('stop-color', gradientColorScale(1-stop))
    })

    const yearScale = d3.scaleLinear()
        .domain(d3.extent(years))
        .range([0, Math.PI*2])
    const graphScale = d3.scaleBand()
        .domain(continents)
        .range([
            outRingInnerR, 
            outRingOuterR
        ])
    const colorScale = d3.scaleLinear()
        .domain([0, continents.length-1])
        .range(['navy', '#713f3f'])
    let graphHeight = graphScale.bandwidth()
    
    const maxSumArray = Object.values(continentsData.sum)
        .map(d => d3.max(d, datum => countAccessor(datum)))
    const maxSum = d3.max(maxSumArray)
    const radiusScale = d3.scaleLinear()
        .domain([0, maxSum])
        .range([0, graphHeight*1.5])

    const maxCumsumArray = Object.values(continentsData.cumsum)
        .map(d => d3.max(d, datum => countAccessor(datum)))
    const maxCumsum = d3.max(maxCumsumArray)
    const cumsumRadiusScale = d3.scaleLinear()
        .domain([0, maxCumsum])
        .range([
            inRingInnerR, 
            inRingOuterR
        ])
        .nice()

    const getCoordFromAngle = (angle, radius=defaultR) => [
        Math.cos(angle - Math.PI/2) * radius,
        Math.sin(angle - Math.PI/2) * radius
    ]
    const getAngleFromCoord = (x, y) => {
        let angle = Math.atan2(y, x) + Math.PI/2
        if (angle < 0) angle = angle + Math.PI*2
        return angle
    }

    bounds.append('circle')
        .attr('class', 'radial-background')
        .attr('r', defaultR*1.2)
        .style('fill', `url(#${bgGradientID})`)
        
    const gridGroup = bounds.append('g')
    const [minYear, maxYear] = yearScale.domain()
    const clockYears = d3.range(1760, 2020, 20)
    if (d3.min(clockYears) - minYear <= 15) clockYears.shift()
    clockYears.unshift(minYear)
    if (maxYear - d3.max(clockYears) <= 15) clockYears.pop()
    clockYears.push(maxYear)
    for (const year of clockYears) {
        const angle = yearScale(year)
        const roundedYear = Math.round(year)
        const [outerRingX1, outerRingY1] = getCoordFromAngle(angle)
        const [outerRingX2, outerRingY2] = getCoordFromAngle(angle, outRingInnerR)
        const [innerRingX1, innerRingY1] = getCoordFromAngle(angle, inRingInnerR)
        const [innerRingX2, innerRingY2] = getCoordFromAngle(angle, inRingOuterR)
        gridGroup.append('line')
            .attr('class', `outer-ring grid-line year-${roundedYear}`)
            .attr('x1', outerRingX1).attr('y1', outerRingY1)
            .attr('x2', outerRingX2).attr('y2', outerRingY2)
        gridGroup.append('line')
            .attr('class', `inner-ring grid-line year-${roundedYear}`)
            .attr('x1', innerRingX1).attr('y1', innerRingY1)
            .attr('x2', innerRingX2).attr('y2', innerRingY2)
        const [labelX, labelY] = getCoordFromAngle(angle, defaultR+textMargin)
        gridGroup.append('text')
            .attr('class', 'small-text grid-year')
            .attr('x', labelX)
            .attr('y', labelY)
            .text(roundedYear==minYear ? `/${roundedYear}` : roundedYear)
            .style('text-anchor', labelX > 30 || roundedYear==minYear ? 'start'
                : labelX < -30 || roundedYear==maxYear ? 'end'
                : 'middle')
            .style('dominant-baseline', labelY < -30 ? 'auto'
                : labelY > 30 ? 'hanging'
                : 'central')
            .style('fill', roundedYear==minYear ? 'silver' : '#222')
    }
    
    const cumsumArea = bounds.append('g')
    const outerArea = bounds.append('g')

    const areaGeneratorCumsum = d3.areaRadial()
        .angle(d => yearScale(yearAccessor(d)))
        .innerRadius(inRingInnerR)
        .outerRadius(d => cumsumRadiusScale(countAccessor(d)))
    const areaGenerator = d3.areaRadial()
        .angle(d => yearScale(yearAccessor(d)))
    const flatLineGenerator = d3.lineRadial()
        .angle(year => yearScale(year))
    
    for (let i = continents.length-1; i>=0; i--) {
        const continent = continents[i]

        cumsumArea.append('path')
            .attr('class', `${continent} cumsum-area`)
            .attr('d', areaGeneratorCumsum(continentsData.cumsum[continent]))
            .style('fill', colorScale(i))
        
        areaGenerator.innerRadius(graphScale(continent))
            .outerRadius(d => graphScale(continent)+radiusScale(countAccessor(d)))
            .curve(d3.curveNatural)
        
        outerArea.append('path')
            .attr('class', `${continent} area`)
            .attr('d', areaGenerator(continentsData.sum[continent]))
            .style('fill', colorScale(i))
            .style('stroke', colorScale(i))
        
        flatLineGenerator.radius(graphScale(continent))
        outerArea.append('path')
            .attr('class', `${continent} area-baseline`)
            .attr('id', `${continent}-path`)
            .attr('d', flatLineGenerator(years))
            // .style('filter', 'url(#glow)')
        
        outerArea.append('text')
            .attr('class', `small-text baseline-above ${continent} continent-name`)
            .attr('x', 10)
            .append('textPath')
                .attr('xlink:href', `#${continent}-path`)
                .text(continent == 'N-America' ? 'North America'
                    : continent == 'S-America' ? 'South America'
                    : continent)
                .style('fill', colorScale(i))
    }

    cumsumArea.append('path')
        .attr('d', () => {
            flatLineGenerator.radius(inRingOuterR+textMargin)
            return flatLineGenerator(years)
        })
        .attr('id', 'cumsum-name-path')
    cumsumArea.append('text')
        .attr('class', 'small-text baseline-above cumsum-area-name')
        .append('textPath')
            .attr('xlink:href', `#cumsum-name-path`)
            .text('Accumulated Discoveries')
    
    outerArea.append('path')
        .attr('d', () => {
            flatLineGenerator.radius(outRingOuterR-graphHeight+textMargin)
            return flatLineGenerator(years)
        })
        .attr('id', 'area-name-path')
    outerArea.append('text')
        .attr('class', 'small-text baseline-above area-name')
        .attr('x', 0)
        .append('textPath')
            .attr('xlink:href', `#area-name-path`)
            .text('New Discoveries per Year')

    const cumsumTicks = cumsumRadiusScale.ticks(5)
    const tickGroups = bounds.append('g')
        .selectAll('.tick')
        .data(cumsumTicks)
        .join('g')
    const tickGrid = tickGroups.append('circle')
        .attr('class', 'tick-grid')
        .attr('r', d => cumsumRadiusScale(d))
    const tickTexts = tickGroups.append('text')
        .attr('class', 'tiny-text align-middle tick-label')
        .attr('x', 0)
        .attr('y', d => cumsumRadiusScale(d))
        .text(d => d ? d3.format(',')(Math.round(d)) : '')

    bounds.append('circle')
        .attr('class', 'listening-circle')
        .attr('r', defaultR)
        .on('mouseenter', onMouseEnter)
        .on('mousemove', onMouseMove)
        .on('mouseleave', onMouseLeave)

    const instruction = bounds.append('text')
        .attr('class', 'small-text')
        .text('☜ Hover for data')
        .attr('x', dimensions.boundedRadius-20)
        .attr('y', -80)

    const textDisplay = bounds.append('g').attr('class', 'continent-data')
    const contDataX = -inRingInnerRExpanded*.3
    const contDataY = -inRingInnerRExpanded*.25
    const cumsumColX = inRingInnerRExpanded *.2
    const yearlyColX = inRingInnerRExpanded *.55
    
    textDisplay.append('text').text('New')
        .attr('class', 'tiny-text align-right faint-text')
        .attr('x', yearlyColX)
        .attr('y', contDataY-14)
    textDisplay.append('text').text('Accum.')
        .attr('class', 'tiny-text align-right faint-text')
        .attr('x', cumsumColX)
        .attr('y', contDataY-14)
    const contDataGroups = textDisplay.selectAll('g')
        .data(continents)
        .join('g')
        .style('transform', (continent, i) => `translate(
            ${contDataX}px,
            ${contDataY + (continents.length-1-i)*13}px
        )`)
        .style('fill', (continent, i) => colorScale(i))
    contDataGroups.append('text')
        .attr('class', 'tiny-text align-right')
        .text((continent, i) => continent.replace('-', '.'))
    const contYearlySum = contDataGroups.append('text')
        .attr('class', 'tiny-text align-right')
        .attr('x', -contDataX+yearlyColX)
    const contCumsum = contDataGroups.append('text')
        .attr('class', 'tiny-text align-right')
        .attr('x', -contDataX+cumsumColX)
    textDisplay.append('text')
        .attr('class', 'tiny-text align-right faint-text')
        .attr('x', contDataX)
        .attr('y', contDataY+continents.length*13+6)
        .text('World')
    const totalYearlySum = textDisplay.append('text')
        .attr('class', 'tiny-text align-right faint-text')
        .attr('x', yearlyColX)
        .attr('y', contDataY+continents.length*13+6)
    const totalYearlyCumsum = textDisplay.append('text')
        .attr('class', 'tiny-text align-right faint-text')
        .attr('x', cumsumColX)
        .attr('y', contDataY+continents.length*13+6)
    textDisplay.append('text').text('－')
        .attr('class', 'tiny-text align-right faint-text')
        .attr('x', yearlyColX)
        .attr('y', contDataY+continents.length*13-3)
    textDisplay.append('text').text('－')
        .attr('class', 'tiny-text align-right faint-text')
        .attr('x', cumsumColX)
        .attr('y', contDataY+continents.length*13-3)
    const hoverYear = textDisplay.append('text')
        .attr('class', 'align-middle hover-year')
        .attr('y', contDataY-36)
    const hoverArc = bounds.append('path')
        .attr('id', 'hover-arc')

    function onMouseEnter() {
        updateGraphDimensions(
            inRingInnerRExpanded,
            inRingOuterRExpanded,
            outRingInnerRExpanded,
            outRingOuterR,
            1.6
        )
        instruction.transition(getTransition(150, d3.easePolyOut)).style('opacity', 0)
        textDisplay.transition(getTransition(150, d3.easePolyOut)).style('opacity', 1)
    }
    function onMouseMove(event) {
        const [x, y] = d3.pointer(event)
        const angle = getAngleFromCoord(x, y)
        const year = Math.round(yearScale.invert(angle))

        const arcGenerator = d3.arc()
            .innerRadius(inRingInnerRExpanded)
            .outerRadius(outRingOuterR+radiusScale.range()[1]-graphHeight)
            .startAngle(angle-0.02)
            .endAngle(angle+0.02)
        hoverArc.attr('d', arcGenerator()).style('opacity', .1)
        hoverYear.text(year)
        contYearlySum.text((continent, i) => {
            const result = continentsData.sum[continent].filter(d => yearAccessor(d)==year)[0]
            return result ? d3.format(',')(countAccessor(result)) : 0
        })
        contCumsum.text((continent, i) => {
            const result = continentsData.cumsum[continent].filter(d => yearAccessor(d)<=year).slice(-1)[0]
            return result ? d3.format(',')(countAccessor(result)) : 0
        })
        totalYearlySum.text(dataset.filter(d => d.year==year).length)
        totalYearlyCumsum.text(d3.format(',')(dataset.filter(d => d.year<=year).length))
    }
    function onMouseLeave() {
        hoverArc.style('opacity', 0)
        updateGraphDimensions()
        instruction.transition(getTransition(150, d3.easePolyOut)).style('opacity', .9)
        textDisplay.transition(getTransition(150, d3.easePolyOut)).style('opacity', 0)
    }
    function updateGraphDimensions(
        inRingInR=inRingInnerR, 
        inRingOutR=inRingOuterR, 
        outRingInR=outRingInnerR, 
        outRingOutR=outRingOuterR,
        gHeightMultiplier=1.5) {
        graphScale.range([outRingInR, outRingOutR])
        graphHeight = graphScale.bandwidth()
        radiusScale.range([0, graphHeight*gHeightMultiplier])
        cumsumRadiusScale.range([inRingInR, inRingOutR])
                
        for (let i = continents.length-1; i>=0; i--) {
            const continent = continents[i]
            areaGeneratorCumsum.innerRadius(inRingInR)
            d3.select(`.${continent}.cumsum-area`)
                .transition(getTransition())
                .attr('d', areaGeneratorCumsum(continentsData.cumsum[continent]))
            areaGenerator.innerRadius(graphScale(continent))
                .outerRadius(d => graphScale(continent)+radiusScale(countAccessor(d)))
                .curve(d3.curveNatural)
            d3.select(`.${continent}.area`)
                .transition(getTransition())
                .attr('d', areaGenerator(continentsData.sum[continent]))
            d3.select(`.${continent}.area-baseline`)
                .transition(getTransition())
                .attr('d', () => {
                    flatLineGenerator.radius(graphScale(continent))
                    return flatLineGenerator(years)
                })
            d3.select(`.${continent}.continent-name textPath`)
                .transition(getTransition())
                .attr('xlink:href', `#${continent}-path`)
        }
        d3.select('#area-name-path')
            .transition(getTransition())
            .attr('d', () => {
                flatLineGenerator.radius(outRingOutR-graphHeight+textMargin)
                return flatLineGenerator(years)
            })
        d3.select('.area-name textPath')
            .attr('xlink:href', `#area-name-path`)
        d3.select('#cumsum-name-path')
            .transition(getTransition())
            .attr('d', () => {
                flatLineGenerator.radius(inRingOutR+textMargin)
                return flatLineGenerator(years)
            })
        d3.select('.cumsum-area-name textPath')
            .attr('xlink:href', `#cumsum-name-path`)
        
        tickGrid.transition(getTransition()).attr('r', d => cumsumRadiusScale(d))
        tickTexts.transition(getTransition()).attr('y', d => cumsumRadiusScale(d))
        for (const year of clockYears) {
            const angle = yearScale(year)
            const roundedYear = Math.round(year)
            const [outerRingX2, outerRingY2] = getCoordFromAngle(angle, outRingInR)
            const [innerRingX2, innerRingY2] = getCoordFromAngle(angle, inRingOutR)
            d3.select(`.outer-ring.grid-line.year-${roundedYear}`)
                .transition(getTransition())
                .attr('x2', outerRingX2).attr('y2', outerRingY2)
            d3.select(`.inner-ring.grid-line.year-${roundedYear}`)
                .transition(getTransition())
                .attr('x2', innerRingX2).attr('y2', innerRingY2)
        }
    }
}
drawRadialChart()

async function drawRidgelineChart() {
    const dataset = await d3.csv('data/220408-spiders/species.csv', d3.autoType)
    const genusNames = await d3.csv('data/220408-spiders/genus-names.csv')

    const yearParser = d3.timeParse('%Y')
    const yearFormatter = d3.timeFormat('%Y')
    const rawYears = Array.from(new Set(dataset.map(d => d.year)))
    const years = rawYears.map(d => yearParser(d))

    const continents = ['Asia', 'Africa', 'N-America', 'S-America', 'Oceania', 'Europe']

    const selectContinent = d3.select('#select-continent')
        .on('change', drawAreas)
    selectContinent.selectAll('.cont')
        .data(continents)
        .join('option')
        .attr('value', d => d)
        .text(d => d=='N-America' ? 'North America'
            : d=='S-America' ? 'South America'
            : d)

    const sortOptions = d3.selectAll('.sort-options input[type=radio')
        .on('click', drawAreas)

    const chart = d3.select('#chart2')
    const width = d3.min([+chart.style('width').slice(0, -2), 700])
    const topNum = 10
    const genusHeight = 60
    const rectWidth = 8
    const margin = 15
    let dimensions = {
        width: width,
        margins: {
            top: 70,
            right: width*.08,
            bottom: 15,
            left: 120
        }
    }
    dimensions.boundedWidth = dimensions.width - dimensions.margins.left - dimensions.margins.right

    const yearScale = d3.scaleTime()
        .domain(d3.extent(years))
        .range([0, dimensions.boundedWidth])
    const colorScale = d3.scaleLinear()
        .domain([0, continents.length-1])
        .range(['#834c4c', '#1f1f9a'])

    const wrapper = chart.append('svg')
    const bounds = wrapper.append('g')

    const defs = wrapper.append('defs')
    const gradientID = 'graph-gradient'
    const gradient = defs.append('linearGradient')
        .attr('id', gradientID)
        .attr('y1', '0%')
        .attr('y2', '100%')
    gradient.append('stop').attr('offset', '0%')
    gradient.append('stop').attr('offset', '20%')
    gradient.append('stop').attr('offset', '100%')

    let yearTicks = width <= 600 ? [1757, 1810, 1860, 1910, 1960, 2019]
        : [1757, 1790, 1830, 1870, 1910, 1950, 1990, 2019]
    yearTicks = yearTicks.map(d => yearParser(d))
    const xAxis = bounds.append('g').attr('class', 'x-axis faint-text')
    const xAxisTicks = xAxis.selectAll('.year')
        .data(yearTicks).join('g')
        .style('transform', `translateY(${-margin}px)`)
    xAxisTicks.append('text')
        .attr('class', 'tiny-text align-middle')
        .attr('x', d => yearScale(d))
        .text(d => yearFormatter(d))
    xAxisTicks.append('line')
        .attr('y1', 9)
        .attr('y2', margin)
        .style('transform', d => `translateX(${yearScale(d)}px)`)
    xAxis.append('line').attr('x2', dimensions.boundedWidth)

    const legendGroups =  bounds.append('g')
        .attr('class', 'legend-groups tiny-text')
    const legendsLeft = legendGroups.append('g')
    const firstSeenLegendX = -margin
    const firstSeenLegendY = -dimensions.margins.top*.7
    legendsLeft.append('text').text('First discovery')
        .attr('class', 'align-right')
        .attr('x', firstSeenLegendX)
        .attr('y', firstSeenLegendY)
    legendsLeft.append('path').attr('class', 'annotation-line-dotted')

    const legendsRightMargin = margin*3.5
    const legendsRight = legendGroups.append('g')
        .style('transform', `translateX(${dimensions.boundedWidth+legendsRightMargin}px)`)
    const cumsumLY = 10
    legendsRight.append('text').text('Accumulated discoveries')
        .attr('y', cumsumLY)
    legendsRight.append('line')
        .attr('class', 'cumsum annotation-line-dotted')
        .attr('x1', -5).attr('x2', -legendsRightMargin)
        .style('transform', `translateY(${cumsumLY}px)`)
    const newDiscLY = 32
    legendsRight.append('text').text('New discoveries in year')
        .attr('y', newDiscLY)
    legendsRight.append('line')
        .attr('class', 'new-disc annotation-line-dotted')
        .attr('x1', -5)
        .style('transform', `translateY(${newDiscLY}px)`)
    const totalSpeciesLY = genusHeight
    legendsRight.append('text').text('Total species in genus')
        .attr('class', 'total-species baseline-above')
        .attr('y', totalSpeciesLY)
    legendsRight.append('line')
        .attr('class', 'total-species annotation-line-dotted')
        .attr('x1', -5).attr('x2', -margin*1.1)
        .style('transform', `translateY(${totalSpeciesLY-3}px)`)

    bounds.append('text')
        .text('Hover to see genus profile☟')
        .attr('class', 'small-text align-right')
        .attr('x', dimensions.boundedWidth)
        .attr('y', firstSeenLegendY)
    
    const genusGroup = bounds.append('g')
    
    const hoverGroup = bounds.append('g')
        .attr('class', 'hover-group')
    const hoverRect = hoverGroup.append('rect')
        .attr('class', 'hover-rect')
        .attr('width', rectWidth)
    
    const profileX = dimensions.boundedWidth+dimensions.margins.left+50
    const profileW = genusHeight*3.5
    const genusProfile = d3.select('.genus-profile')
        .style('width', `${profileW}px`)
        .style('transform', `translateX(${profileX}px)`)
    const genusPic = genusProfile.select('img')
        .attr('width', profileW)
    
    const listeningRect = bounds.append('rect')
        .attr('class', 'listening-rect')
        .attr('x', -20)
        .attr('width', dimensions.boundedWidth+40)
    
    function drawAreas() {
        const continent = selectContinent.property('value')
        const contIndex = continents.findIndex(d => d==continent)
        const sortBy = sortOptions.filter(':checked').attr('id')
        const primaryColor = continent=='world'? '#683571' : colorScale(contIndex)

        selectContinent.style('color', primaryColor)
            .style('text-decoration-color', primaryColor)
        const options = d3.select('.sort-options')
        options.selectAll('label').style('color', '#222')
        options.selectAll('.check').style('border-color', '#222')
            .style('background', 'none')
        const selected = d3.select(`div.${sortBy}-div`)
        selected.select('label').style('color', primaryColor)
        selected.select('.check').style('border-color', primaryColor)
            .style('background', primaryColor)
        
        const data = continent=='world' ? dataset
            : dataset.filter(d => d[continent]==1)
        
        let sorted = []
        if (sortBy=='total-species') {
            sorted = d3.rollups(data, v => v.length , d => d.genus)
            sorted.sort((a, b) => d3.descending(a[1], b[1]))
        } else {
            const firstSeen = d3.rollups(data, v => d3.min(v, d => d.year), d => d.genus)
            const fsGenus = firstSeen.map(d => d[0])
            const fsYears = firstSeen.map(d => d[1])
            const fsSpecies = d3.rollups(dataset, v => v.length , d => d.genus).map(d => d[1])
            sorted = d3.zip(fsGenus, fsYears, fsSpecies)
            sorted
                .sort((a, b) => d3.descending(a[2], b[2]))
                .sort((a, b) => d3.ascending(a[1], b[1]))
        }

        const genera = sorted.map(d => d[0])
        const genusNum = genera.length >= topNum ? topNum : genera.length
        const genusToShow = genera.slice(0, genusNum)

        let genusData = {}
        const genusRaw = d3.groups(
            data.filter(d => genusToShow.includes(d.genus)),
            d => d.genus,
            d => d.year
        )
        genusRaw.forEach((d, i) => {
            const genus = d[0]
            const data = d[1]
            genusData[genus] = []
            
            rawYears.forEach(rawYear => {
                const newSpeciesInYear = data.filter(d => d[0]==rawYear)
                const cumsumData = data.filter(d => d[0] <= rawYear)
                const cumsumSpecies = d3.sum(cumsumData.map(d => d[1].length))
                const year = yearParser(rawYear)
                if (newSpeciesInYear.length) genusData[genus].push({
                    year: year,
                    newSpecies: newSpeciesInYear[0][1].length,
                    cumsum: cumsumSpecies
                })
                else genusData[genus].push({
                    year: year,
                    newSpecies: 0,
                    cumsum: cumsumSpecies
                })
            })
            genusData[genus].sort((a, b) => d3.ascending(a.year, b.year))
        })

        dimensions.boundedHeight = genusNum*genusHeight
        dimensions.height = dimensions.boundedHeight 
            + dimensions.margins.top + dimensions.margins.bottom
        
        wrapper.attr('width', dimensions.width)
            .attr('height', dimensions.height)
        bounds.style('transform', `translate(
            ${dimensions.margins.left}px,
            ${dimensions.margins.top}px
        )`)

        hoverRect.attr('height', dimensions.boundedHeight)

        const stops = gradient.selectAll('stop')
            .attr('stop-color', primaryColor)
        stops.filter((d, i)=> i==2)
            .attr('stop-color', 'gainsboro')

        const genusScale = d3.scaleBand()
            .domain(genusToShow)
            .range([0, dimensions.boundedHeight])
        const maxSpecies = d3.max(Object.values(genusData).map(d => d3.max(d, d => d.newSpecies)))
        const speciesScale = d3.scaleLinear()
            .domain([0, maxSpecies*.9])
            .range([genusHeight, 0])
        const maxCumsum = d3.max(Object.values(genusData).map(d => d.slice(-1)[0].cumsum))
        const cumsumScale = d3.scaleLinear()
            .domain([0, maxCumsum])
            .range([genusHeight, 0])

        genusGroup.selectChildren().remove()
        const genusGroups = genusGroup.selectAll('.genus-group')
            .data(genusToShow)
            .join('g')
            .attr('class', genus => `${genus} genus-group`)
            .style('transform', genus => `translateY(${genusScale(genus)+genusHeight}px)`)

        genusGroups.append('line')
            .attr('class', 'genus-grid')
            .attr('x1', 0)
            .attr('x2', dimensions.boundedWidth)
    
        genusGroups.append('text')
            .attr('class', 'small-text align-right baseline-above genus-name')
            .attr('x', -margin)
            .text(genus => genus)
        
        const cumsumAreaGenerator = d3.area()
            .x(d => yearScale(d.year))
            .y0(0)
            .curve(d3.curveBasis)
        genusGroups.append('path')
            .attr('class', 'genus-area-cumsum')
            .attr('d', genus => {
                cumsumAreaGenerator.y1(0)
                return cumsumAreaGenerator(genusData[genus])
            })
            .transition(getTransition(300, d3.easePolyOut))
                .attr('d', genus => {
                    cumsumAreaGenerator.y1(d => cumsumScale(d.cumsum)-genusHeight)
                    return cumsumAreaGenerator(genusData[genus])
                })
                .style('fill', `url(#${gradientID})`)

        const areaGenerator = d3.area()
            .x(d => yearScale(d.year))
            .y0(0)
            .curve(d3.curveBasis)
        genusGroups.append('path')
            .attr('class', 'genus-area')
            .attr('d', genus => {
                areaGenerator.y1(0)
                return areaGenerator(genusData[genus])
            })
            .transition(getTransition(300, d3.easePolyOut))
                .attr('d', genus => {
                    areaGenerator.y1(d => speciesScale(d.newSpecies)-genusHeight)
                    return areaGenerator(genusData[genus])
                })
                .style('fill', primaryColor)

        genusGroups.append('text')
            .attr('class', 'tiny-text align-left baseline-above total-species-num')
            .attr('x', dimensions.boundedWidth+margin)
            .text(genus => d3.format(',')(genusData[genus].slice(-1)[0].cumsum))
            .style('fill', primaryColor)
            .style('opacity', sortBy=='total-species' ? 1 : .2)

        const firstSeenGroups = genusGroups.append('g')
            .style('opacity', sortBy=='first-discovery' ? .9 : .35)
            .style('transform', genus => {
                const genusMinYear = genusData[genus].filter(d => d.cumsum>0)[0].year
                return `translateX(${yearScale(genusMinYear)}px)`
            })
        firstSeenGroups.append('line')
            .attr('y1', 0)
            .attr('y2', 0)
            .attr('class', 'first-seen-line')
            .style('stroke', primaryColor)
            .transition(getTransition(300, d3.easePolyOut))
                .attr('y2', -14)
        const eyeY = -14
        firstSeenGroups.append('text')
            .text('👁')
            .attr('class', 'tiny-text align-middle')
            .attr('y', 0)
            .transition(getTransition(300, d3.easePolyOut))
                .attr('y', eyeY)

        if (continent=='world') {
            legendGroups
                .transition(getTransition(150, d3.easePolyOut))
                .style('opacity', 1)
            
            legendsLeft
                .transition(getTransition(150, d3.easePolyOut))
                .style('opacity', sortBy=='first-discovery' ? 1 : .25)
            const topGenusG = firstSeenGroups.nodes()[0]
            const firstSeenLineX = firstSeenLegendX*3
            const firstSeendLineX2 = parseFloat(d3.select(topGenusG).style('transform').split('(')[1].split('p')[0])
            const firstSeenLineTopY = firstSeenLegendY+10
            const firstSeenLineMidY = genusHeight*.45
            const firstSeenLineBotY = genusHeight+eyeY-4
            legendsLeft.select('path')
                .attr('d', () => {
                    const points = [
                        [firstSeenLineX, firstSeenLineTopY],
                        [firstSeenLineX, firstSeenLineMidY],
                        [firstSeendLineX2, firstSeenLineMidY],
                        [firstSeendLineX2, firstSeenLineBotY]
                    ]
                    return line(points)
                })
            
            legendsRight.selectAll('.total-species')
                .transition(getTransition(150, d3.easePolyOut))
                .style('opacity', sortBy=='total-species' ? 1 : .25)
            const maxNewSpeciesYear = genusData[genusToShow[0]]
                .map(d => [d.newSpecies, d.year])
                .sort((a, b) => d3.descending(a[0], b[0]))[0][1]
            const newDiscX2 = dimensions.boundedWidth-yearScale(maxNewSpeciesYear)
            legendsRight.select('.new-disc').attr('x2', -legendsRightMargin-newDiscX2)

        } else legendGroups
            .transition(getTransition(300, d3.easePolyOut))
            .style('opacity', 0)

        listeningRect.attr('height', dimensions.boundedHeight)
            .on('mouseenter', onMouseEnter)
            .on('mousemove', onMouseMove)
            .on('mouseleave', onMouseLeave)

        const tooltip = d3.select('#chart2 .tooltip')
        function onMouseEnter() {
            legendGroups
                .transition(getTransition(100, d3.easePolyOut))
                .style('opacity', 0)
            hoverGroup.style('opacity', 1)
            tooltip
                .transition(getTransition(100, d3.easePolyOut))
                .style('opacity', 1)
        }
        function onMouseMove(event) {
            const [x, y] = d3.pointer(event)
            const hoverYear = yearFormatter(yearScale.invert(x))

            let hoverGenus = ''
            let profileY = 0
            genusToShow.forEach((genus, i) => {
                const y1 = genusScale(genus)
                const y2 = y1 + genusHeight
                if (y1 <= y && y < y2) {
                    hoverGenus = genus
                    profileY = y1+genusHeight/2
                }
            })
            const genusIndex = genusToShow.findIndex(genus => genus==hoverGenus)

            hoverRect.attr('x', d3.median([
                    0, x-rectWidth/2, dimensions.boundedWidth-rectWidth
                ]))
            
            if (hoverGenus) {
                genusGroup.selectAll('.genus-group').style('opacity', .2)
                genusGroup.select(`.${hoverGenus}`).style('opacity', 1)
                genusProfile.select('.genus-name').text(hoverGenus)
                genusPic.attr('src', `images/220408-spiders/${hoverGenus}.jpeg`)
                const data = genusData[hoverGenus].filter(d => yearFormatter(d.year)==hoverYear)[0]
                if (data) {
                    const newInYear = data.newSpecies
                    const cumsumInYear = data.cumsum
                    const yearFirstSeen = genusData[hoverGenus].filter(d => d.cumsum>0)[0].year
                    const tooltipX = x+dimensions.margins.left
                    const tooltipY = profileY+dimensions.margins.top-genusHeight*.3
                    tooltip
                        .style('transform', `translate(
                            calc(-50% + ${tooltipX}px),
                            calc(-100% + ${tooltipY}px)
                        )`)
                        // .style('opacity', 1)
                    tooltip.select('.year').text(hoverYear)
                    tooltip.select('.new-species').text(newInYear)
                    tooltip.select('.cumsum').text(cumsumInYear)
                    
                    const profileH = parseFloat(genusProfile.style('height').slice(0, -2))
                    profileY = genusIndex < 2 ? dimensions.margins.top-27
                        : genusIndex > 7 ? dimensions.height-dimensions.margins.bottom-profileH+5
                        : profileY+dimensions.margins.top-profileH/2
                    genusProfile.style('opacity', 1)
                        .transition(getTransition(300, d3.easePolyOut))
                        .style('transform', `translate(
                            ${profileX}px,
                            ${profileY}px
                        )`)
                    genusProfile.select('.continent').text(continent=='world' ? ''
                        : continent=='N-America' ? 'in North America'
                        : continent=='S-America' ? 'in South America'
                        : `in ${continent}`)
                    genusProfile.select('.first-seen').text(yearFormatter(yearFirstSeen))
                    genusProfile.select('.common-name').text(genusNames.filter(d => d.genus==hoverGenus)[0].commonName)
                }
            }
        }

        function onMouseLeave() {
            legendGroups.transition(getTransition(100, d3.easePolyOut))
                .style('opacity', continent=='world' ? 1 : 0)
            hoverGroup.style('opacity', 0)
            genusGroup.selectAll('.genus-group').style('opacity', 1)
            genusProfile
                .transition(getTransition(100, d3.easePolyOut))
                .style('opacity', 0)
            tooltip
                .transition(getTransition(100, d3.easePolyOut))
                .style('opacity', 0)
        }
    }
    drawAreas()
}
drawRidgelineChart()

function getTransition(duration=250, ease=d3.easeBackOut) {
    return d3.transition()
        .duration(duration)
        .ease(ease)
}
const line = d3.line()