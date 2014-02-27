( function() {
        //
        'use strict';

        /**
         * pViz disply for pdb coverage
         * that's  a background thine line for the overall coverage and thicker line where there is an actual 3D structure
         */
        pviz.FeatureDisplayer.setCustomHandler('pdb_coverage', {
            appender : function(viewport, svgGroup, features, type) {
                var sel = svgGroup.selectAll('g.feature.data.' + type).data(features).enter().append('g').attr('transform', function(ft) {
                    return 'translate(0,' + viewport.scales.y(ft.displayTrack + 0.5) + ')';
                }).attr('class', function(ft) {
                    return 'feature data ' + type + ' ' + ft.xref.method.toLowerCase().replace(/\W/g, '_');
                });

                sel.append('line').attr('class', 'line-background');
                sel.selectAll('line.chain').data(function(ft) {
                    return ft.xref.chains;
                }).enter().append('line').attr('class', 'chain');
                return sel;
            },
            positioner : function(viewport, d3selection) {
                d3selection.selectAll('line.line-background').attr('x1', function(ft) {
                    return viewport.scales.x(ft.start - 0.4);
                }).attr('x2', function(ft) {
                    return viewport.scales.x(ft.end + 0.4);
                });
                d3selection.selectAll('line.chain').attr('x1', function(ft) {
                    return viewport.scales.x(ft.start - 0.4);
                }).attr('x2', function(ft) {
                    return viewport.scales.x(ft.end + 0.4);
                });
                return d3selection;
            }
        });

        /*
         * PSMS are simple rendered as lines
         */
        pviz.FeatureDisplayer.setCustomHandler('psm', {
            appender : function(viewport, svgGroup, features, type) {
                var sel = svgGroup.selectAll('g.feature.data.' + type).data(features).enter().append('g').attr('transform', function(ft) {
                    return 'translate(0,' + viewport.scales.y(ft.displayTrack + 0.5) + ')';
                }).attr('class', 'feature data ' + type);
                sel.append('line');
                return sel;
            },
            positioner : function(viewport, d3selection) {
                d3selection.selectAll('line').attr('x1', function(ft) {
                    return viewport.scales.x(ft.start - 0.4);
                }).attr('x2', function(ft) {
                    return viewport.scales.x(ft.end + 0.4);
                });
                return d3selection;
            }
        });
        /*
         * PSMS are simple rendered as lines
         */
        pviz.FeatureDisplayer.setCustomHandler('ptm', {
            appender : function(viewport, svgGroup, features, type) {
                var sel = svgGroup.selectAll('g.feature.data.' + type).data(features).enter().append('g').attr('transform', function(ft) {
                    return 'translate(0,' + viewport.scales.y(ft.displayTrack + 0.5) + ')';
                }).attr('class', function(ft) {
                    return 'feature data ' + type + ' ' + ft.modif.toLowerCase();
                });
                sel.append('circle').attr('r', function(ft) {
                    return 4 + 6 * ft.relativeQuanti;
                });
                return sel;
            },
            positioner : function(viewport, d3selection) {
                d3selection.selectAll('circle').attr('cx', function(ft) {
                    return viewport.scales.x(ft.start);
                });
                return d3selection;
            }
        });
        /*
         * add vertical label
         */
        pviz.FeatureDisplayer.setCustomHandler('aa-position', {
            appender : function(viewport, svgGroup, features, type) {
                var sel = svgGroup.selectAll('g.feature.data.' + type).data(features).enter().append('g').attr('class', 'feature data ' + type);
                sel.append('g').attr('transform', 'rotate(270)').append('g').attr('class', 'shrink').append('text').text(function(ft) {
                    return ft.text;
                });
                return sel;
            },
            positioner : function(viewport, d3selection) {
                d3selection.attr('transform', function(ft) {
                    return 'translate(' + viewport.scales.x(ft.start) + ',' + viewport.scales.y(ft.displayTrack - 1) + ')';
                });
                var delta1 = viewport.scales.x(1) - viewport.scales.x(0);
                d3selection.selectAll('g.shrink').attr('transform', function() {
                    if (delta1 > 10) {
                        return '';
                    }
                    return 'scale(' + (0.5 + delta1 / 20) + ',' + (1.0 * delta1 / 10) + ')';
                });
                return d3selection;
            }
        });

        return undefined;
    }());
