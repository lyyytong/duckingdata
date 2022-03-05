async function drawChart() {
    const raw = await d3.csv('data/220204-penguins/penguins_size.csv')

    let dataset = []
    const keyFeatures = ['culmen_length_mm','culmen_depth_mm', 'body_mass_g', 'flipper_length_mm']
    raw.forEach(d => {
        const object = {}
        object.species = d.species
        if (d.sex!='.' && d.sex!='NA') object.gender = d.sex
        else return
        for (const key of keyFeatures) {
            if (!isNaN(+d[key])) object[key] = +d[key]
            else return
        }
        dataset.push(object)
    })
    
    const width = +d3.select('#chart').style('width').slice(0, -2)
    let dimensions = {
        width: width,
        height: width/2,
        margins: {
            top: 10,
            right: 10,
            bottom: 10,
            left: width/5.8
        },
    }
    dimensions.boundedWidth = dimensions.width - dimensions.margins.left - dimensions.margins.right
    dimensions.boundedHeight = dimensions.height - dimensions.margins.top - dimensions.margins.bottom

    const wrapper = d3.select('#chart')
        .append('svg')
        .attr('width', dimensions.width)
        .attr('height', dimensions.height)

    const bounds = wrapper.append('g')
        .style('transform', `translate(
            ${dimensions.margins.left}px,
            ${dimensions.margins.top}px
        )`)

    const genderAccessor = d => d.gender
    const culmenLengthAccessor = d => d.culmen_length_mm
    const culmenDepthAccessor = d => d.culmen_depth_mm
    const flipperLengthAccessor = d => d.flipper_length_mm
    const bodyMassAccessor = d => d.body_mass_g/1000 // convert g to kg

    const genderScale = d3.scaleOrdinal()
        .domain(['MALE', 'FEMALE'])
        .range(['blue', 'green'])
    const culmenLengthScale = d3.scaleLinear()
        .domain([
            d3.min(dataset, culmenLengthAccessor)*.95,
            d3.max(dataset, culmenLengthAccessor)*1.05
        ])
        .range([dimensions.boundedHeight, 0])
        .nice()
    const culmenDepthScale = d3.scaleLinear()
        .domain([
            d3.min(dataset, culmenDepthAccessor)*.95,
            d3.max(dataset, culmenDepthAccessor)*1.05
        ])
        .range([dimensions.boundedHeight, 0])
        .nice()
    const flipperLengthScale = d3.scaleLinear()
        .domain([
            d3.min(dataset,flipperLengthAccessor)*.95,
            d3.max(dataset, flipperLengthAccessor)*1.05
        ])
        .range([dimensions.boundedHeight, 0])
        .nice()
    const bodyMassScale = d3.scaleLinear()
        .domain([
            d3.min(dataset, bodyMassAccessor)*.95,
            d3.max(dataset, bodyMassAccessor)*1.05
        ])
        .range([dimensions.boundedHeight, 0])
        .nice()

    const charts = [
        {name: 'Beak Length (mm)', accessor: culmenLengthAccessor, scale: culmenLengthScale, text: ' longer beak'}, 
        {name: 'Beak Depth (mm)', accessor: culmenDepthAccessor, scale: culmenDepthScale, text: ' thicker beak'},
        {name: 'Wing Length (mm)', accessor: flipperLengthAccessor, scale: flipperLengthScale, text: ' longer wings'}, 
        {name: 'Body Mass (kg)', accessor: bodyMassAccessor, scale: bodyMassScale, text: ' heavier'}
    ]
    const chartScale = d3.scaleBand()
        .domain(charts.map(d => d.name))
        .range([0, dimensions.boundedWidth])
        .paddingInner(.25)
    const chartWidth = chartScale.bandwidth()

    function getTransition() {
        return d3.transition()
            .duration(1000)
            .ease(d3.easePolyOut)
    }

    charts.forEach(chart => {
        const chartPosition = chartScale(chart.name)
        const chartName = chart.name.slice(0, -5).replace(' ', '-').toLowerCase()

        const allMaleAvg = d3.mean(dataset.filter(d => d.gender=='MALE'), chart.accessor)
        const allFemaleAvg = d3.mean(dataset.filter(d => d.gender=='FEMALE'), chart.accessor)
        
        bounds.append('g').attr('class', `circle-group ${chartName}`)
        bounds.append('g').attr('class', `avg-group ${chartName}`)

        bounds.append('text')
            .attr('class', 'legend-text')
            .text(chart.name)
            .attr('x', chartPosition)
            .style('opacity', .2)

        
        const outliersGroup = bounds.append('g')
            .attr('class', `${chartName} outliers`)
            .style('opacity', 0)
        outliersGroup.append('text')
            .attr('class', `legend-text`)
            .text('Removed:')
            .attr('x', chartPosition)
            .attr('y', 20)
        outliersGroup.append('text')
            .attr('class', `legend-text removed`)
            .attr('x', chartPosition)
            .attr('y', 40)

        const [min, max] = chart.scale.domain()
        const tickValues = [
            min,
            d3.sum([min, max])/2,
            max
        ]
        const yAxisGenerator = d3.axisLeft(chart.scale)
            .tickValues(tickValues)
        const yAxis = bounds.append('g').attr('class', 'axis')
            .call(yAxisGenerator)
            .style('transform', `translateX(${chartPosition+chartWidth}px)`)
    })

    const options = d3.selectAll('#chart input[type=radio]').on('click', onOptionChange)
    const optionOutliers = d3.select('#chart input[type=checkbox]').on('click', onOptionChange)
    let selected = options.filter(':checked').attr('id')
    let excludeOutliers = optionOutliers.filter(':checked')
    updateChart()
    function onOptionChange() {
        selected = options.filter(':checked').attr('id')
        excludeOutliers = optionOutliers.filter(':checked')
        updateChart()
    }
    function updateChart() {
        charts.forEach(chart => {
            const chartName = chart.name.slice(0, -5).replace(' ', '-').toLowerCase()
            const chartPosition = chartScale(chart.name)
            const circlesPosition = chartPosition + chartWidth/2
            let data = dataset.filter(d => d.species==selected).map(d => Object.create(d))
            let genderData = {}
            if (!excludeOutliers.empty()) {
                genderScale.domain().forEach(gender => {
                    const values = data.filter(d => d.gender==gender).map(d => chart.accessor(d))
                    const q1 = d3.quantile(values, .25)
                    const q3 = d3.quantile(values, .75)
                    const iqr = q3 - q1
                    const upperWhisker = q3 + 1.5*iqr
                    const lowerWhisker = q1 - 1.5*iqr
                    const key = gender.toLowerCase() 
                    genderData[key] = data.filter(d => (d.gender==gender)
                        && (chart.accessor(d) >= lowerWhisker)
                        && (chart.accessor(d) <= upperWhisker))
                    genderData[`${key}Removed`] = values.length - genderData[key].length
                })
                data = genderData.male.concat(genderData.female)
            }

            const maleAvg = d3.mean(data.filter(d => d.gender=='MALE'), chart.accessor)
            const femaleAvg = d3.mean(data.filter(d => d.gender=='FEMALE'), chart.accessor)
    
            const simulation = d3.forceSimulation(data)
                .force('x', d3.forceX(circlesPosition).strength(.1))
                .force('y', d3.forceY(d => chart.scale(chart.accessor(d))).strength(1))
                .force('collide', d3.forceCollide(5))
                .stop()
                .tick(250)
    
            const circles = d3.select(`.circle-group.${chartName}`)
                .selectAll(`.circle`)
            circles.data(data).exit().remove()
            circles.data(data)
                .enter()
                .append('circle').attr('class',`circle`)
                    .attr('cx', circlesPosition)
                    .attr('cy', dimensions.boundedHeight)
                .merge(circles).transition(getTransition())
                        .attr('r', 4)
                        .attr('fill', d => genderScale(genderAccessor(d)))
                        .attr('cx', d => d.x)
                        .attr('cy', d => d.y)
            
            const avgGroup = d3.select(`.avg-group.${chartName}`)
            let avgLine = avgGroup.select(`.line-avg`)
            if (avgLine.empty()) avgLine = avgGroup.append('line')
                .attr('class', `line-avg`)
                .style('transform', `translateX(${circlesPosition}px)`)
                .attr('y1', dimensions.boundedHeight)
                .attr('y2', dimensions.boundedHeight)
            avgLine.transition(getTransition())
                .attr('y1', chart.scale(maleAvg))
                .attr('y2', chart.scale(femaleAvg))
    
            const averages = {
                male: maleAvg,
                female: femaleAvg
            }
            for (const gender of Object.keys(averages)) {
                let avgCircle = avgGroup.select(`.circle-avg.${gender}`)
                if (avgCircle.empty()) avgCircle = avgGroup.append('circle')
                    .attr('class', `circle-avg ${gender}`)
                    .attr('cx', circlesPosition)
                    .attr('cy', dimensions.boundedHeight)
                    .attr('r', 4)
                    .attr('stroke', gender=='male'
                        ? genderScale.range()[0]
                        : genderScale.range()[1])
                avgCircle.transition(getTransition())
                    .attr('cy', chart.scale(averages[gender]))
            }
            
            let avgText = avgGroup.select(`.legend-text.gender-gap`)
            if (avgText.empty()) avgText = avgGroup.append('text')
                .attr('class', `legend-text gender-gap`)
                .attr('x', circlesPosition+5)
                .attr('y', dimensions.boundedHeight)
                .style('text-anchor', 'start')
            avgText.transition(getTransition())
                .text(d3.format('.1%')(maleAvg/femaleAvg-1))
                .attr('y', chart.scale(d3.sum([maleAvg, femaleAvg])/2))

            let caption = avgGroup.select('.legend-text.caption')
            if (caption.empty()) caption = avgGroup.append('text')
                .attr('class', 'legend-text caption')
                .attr('x', chartPosition)
                .attr('y', dimensions.boundedHeight)
            caption.text(d3.format('.1%')(maleAvg/femaleAvg-1) + chart.text)

            const outliersGroup = d3.select(`.${chartName}.outliers`)
            const maleRemoved = genderData.maleRemoved
            const femaleRemoved = genderData.femaleRemoved
            
            if (maleRemoved || femaleRemoved) {
                outliersGroup.style('opacity', .2)
                outliersGroup.select(`.removed`)
                    .text(maleRemoved && femaleRemoved 
                        ?`${maleRemoved} males, ${femaleRemoved} females`
                        : maleRemoved ? `${maleRemoved} males`
                        : `${femaleRemoved} females`)
            } else outliersGroup.style('opacity', 0)
        })
    }

    const legendGroup = bounds.append('g')
        .style('transform', `translateX(${-dimensions.margins.left}px)`)
    legendGroup.append('line')
        .attr('class', `line-avg`)
        .style('transform', `translateX(5px)`)
        .attr('y1', 80)
        .attr('y2', 180)
    legendGroup.append('text')
        .attr('class', 'legend-text')
        .text('% difference')
        .attr('x', 15)
        .attr('y', 130)
    genderScale.domain().forEach((gender, i) => {
        legendGroup.append('circle')
            .attr('class', 'circle')
            .attr('r', 4)
            .attr('fill', genderScale(gender))
            .attr('cx', 5)
            .attr('cy', 30+i*25)
            .style('opacity', .9)
        legendGroup.append('text')
            .attr('class', 'legend-text')
            .text(gender.slice(0, 1) + gender.slice(1).toLowerCase())
            .attr('x', 15)
            .attr('y', 30+i*25)
        legendGroup.append('circle')
            .attr('class', 'circle-avg')
            .attr('r', 4)
            .attr('fill', genderScale(gender))
            .attr('cx', 5)
            .attr('cy', 80 + i*100)
            .attr('stroke', gender=='MALE'
                ? genderScale.range()[0]
                : genderScale.range()[1])
        legendGroup.append('text')
            .attr('class', 'legend-text')
            .text(gender.slice(0, 1) + gender.slice(1).toLowerCase() + ' Average')
            .attr('x', 15)
            .attr('y', 80 + i*100)
        legendGroup.append('text')
            .attr('class', 'legend-text')
            .attr('y', dimensions.boundedHeight-20)
            .text('On average,')
        legendGroup.append('text')
            .attr('class', 'legend-text')
            .attr('y', dimensions.boundedHeight)
            .text('males have/is...')
    })
    
}   

drawChart()