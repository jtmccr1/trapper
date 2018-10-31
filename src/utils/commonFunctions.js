import * as d3 from 'd3v4';

export const drawAxis = (svgGroup, xScale, yScale, size, margins, options = { rotate: 0, xlab: '', ylab: '' }) => {
	//Make axis
	const xAxis = d3
		.axisBottom()
		.scale(xScale)
		.ticks(10);
	const yAxis = d3
		.axisLeft()
		.scale(yScale)
		.ticks(5);
	// draw Axis
	svgGroup
		.append('g')
		.attr('class', 'x-axis axis')
		.attr('transform', `translate(0,${size[1] - margins.top - margins.bottom} )`)
		.call(xAxis)
		.selectAll('text')
		.attr('y', 0)
		.attr('x', 9)
		.attr('transform', `rotate(${options.rotate})`)
		.style('text-anchor', 'start');
	// Add the text label for the x axis
	svgGroup
		.append('text')
		.attr('transform', `translate(${size[0] / 2},${size[1] - margins.top - margins.bottom + 30})`)
		.style('text-anchor', 'middle')
		.text(options.xlab);
	svgGroup
		.append('g')
		.attr('class', 'y-axis axis')
		.attr('transform', `translate(${margins.left},0)`)
		.call(yAxis);
	// Add the text label for the Y axis
	svgGroup
		.append('text')
		.attr('transform', 'rotate(-90)')
		.attr('y', margins.left - 45)
		.attr('x', 0 - size[1] / 2)
		.attr('dy', '1em')
		.style('text-anchor', 'middle')
		.text(options.ylab);
};
//https://stackoverflow.com/questions/1960473/get-all-unique-values-in-a-javascript-array-remove-duplicates
export const onlyUnique = (value, index, self) => {
	return self.indexOf(value) === index;
};
//https://stackoverflow.com/questions/35813177/d3-simple-drop-down-menu-on-click
