( function() {
        //
        'use strict';
        var pviz = window.pviz;
        var Uniprot = window.Uniprot;

        if (!window.WebGLRenderingContext) {
            window.alert('It appears that your browser does not support WebGL\nYou will miss most of this demo.\nVisit http://get.webgl.org/ to know more.');
        }

        var pdbURl = function(pdbId) {
            return 'http://www.rcsb.org/pdb/files/' + pdbId.toUpperCase() + '.pdb';
        };

        var proteinId = 'P04626';
        /* makes three ajax queries:
         * - uniprot txt source
         * - tsv list of PSMs
         * - tsv list of PTMs
         */
        $.when($.get('http://www.uniprot.org/uniprot/' + proteinId + '.txt'), $.get('data/' + proteinId + '-psms.txt'), $.get('data/' + proteinId + '-ptms.txt')).done(function(respUniprotDat, respTxtPsms, respTxtPtms) {

            var reader = new Uniprot.Reader();
            var protein = reader.buildCanonicalEntry(respUniprotDat[0]);

            var seqEntry = new pviz.SeqEntry({
                sequence : protein.sequence
            });

            new pviz.SeqEntryAnnotInteractiveView({
                model : seqEntry,
                el : '#pviz',
                xChangeCallback : function(pStart, pEnd) {
                    lightAt((pStart + pEnd) / 2);
                }
            }).render();

            pviz.FeatureDisplayer.addClickCallback(['pdb_coverage'], function(ft) {
                showPDB(ft.xref);
            });

            /*
             * extract the PTMs from the tsv file
             *
             */
            var ptms = txt2tsv(respTxtPtms[0]);

            /*
             * extract PTMs positions to label the amino acids
             */
            var aSeq = protein.sequence.split('');
            seqEntry.addFeatures(ptms.map(function(ptm) {
                return {
                    category : 'position',
                    categoryName : '',
                    type : 'aa-position',
                    start : ptm.position,
                    end : ptm.position,
                    text : aSeq[ptm.position] + (1 + parseInt(ptm.position))
                };
            }));

            /*
             * and PTMs them ad features
             */
            var maxQuanti = _.chain(ptms).pluck('quanti').map(function(q) {
                return parseFloat(q);
            }).max().value();
            seqEntry.addFeatures(ptms.map(function(ptm) {
                return {
                    category : 'ptms',
                    type : 'ptm',
                    start : ptm.position,
                    end : ptm.position,
                    modif : ptm.modif,
                    relativeQuanti : parseFloat(ptm.quanti) / maxQuanti
                };
            }));
            /*
             * extract the PSMS from the defined TSV file and add them as features
             */
            var psms = txt2tsv(respTxtPsms[0]);
            seqEntry.addFeatures(psms.map(function(psm) {
                return {
                    category : 'psms',
                    type : 'psm',
                    start : psm.start,
                    end : psm.end
                };
            }));

            //add PDB domain feature
            seqEntry.addFeatures(protein.xrefs.PDB.map(function(xrPDB) {
                var posMin = _.chain(xrPDB.chains).pluck('start').min().value();
                var posMax = _.chain(xrPDB.chains).pluck('end').max().value();
                return {
                    type : 'pdb_coverage',
                    category : 'pdb',
                    start : posMin,
                    end : posMax,
                    xref : xrPDB
                };
            }));

            //setup the glMol
            var elPDB = $('#pdb');
            var elGLMol = $('#glmol');
            var elPDBDetails = $('#pdb-details');

            var glmol;
            var pdb;
            var lights = [];
            var setupGLMOL = function() {
                glmol = new GLmol('glmol', true);
                glmol.initializeScene();
                glmol.setBackground(0xffffff, 1);
                glmol.modelGroup.fog = new THREE.Fog(0x040306, 1, 200);
            };

            /*jshint multistr: true */
            var templateDetails = '<h3><a href="http://www.rcsb.org/pdb/explore.do?structureId=<%= id%>" target="__TOP__"><%= id %></a></h3> \
            <em>"<%= journal.TITL %>"</em><br/> \
            <%= journal.AUTH %>  <br/>\
            <a href="http://www.ncbi.nlm.nih.gov/pubmed/<%= journal.PMID %>" target="__TOP__">pubmed: <%= journal.PMID %></a> <%= journal.REF %>\
            ';

            var showPDB = function(xref) {
                elPDB.hide();
                var pdbId = xref.id;
                $.get(pdbURl(pdbId), function(ret) {
                    elPDB.show();
                    elPDBDetails.empty();

                    if (glmol === undefined) {
                        elGLMol.height(elGLMol.width() / 1.618);
                        setupGLMOL();
                    }

                    pdb = new PDB(ret, xref);
                    elPDBDetails.html(_.template(templateDetails, pdb.meta));

                    glmol.loadMoleculeStr(undefined, pdb.cleanupContent());

                    var materials = {
                        'PSM' : new THREE.MeshLambertMaterial({
                            color : 0x7570b3,
                            transparent : true,
                            opacity : 0.8,
                            side : THREE.DoubleSide
                        }),
                        'PTM_phospho' : new THREE.MeshLambertMaterial({
                            color : 0xd95f02,
                            transparent : true,
                            opacity : 0.8,
                            side : THREE.DoubleSide
                        }),
                        'PTM_methyl' : new THREE.MeshLambertMaterial({
                            color : 0x1b9e77,
                            transparent : true,
                            opacity : 0.8,
                            side : THREE.DoubleSide
                        })
                    };
                    ptms.forEach(function(ptm) {
                        var paths = pdb.get3DPoints(ptm.position, ptm.position);
                        //path can be empty (nothing for the chain or contain one point)
                        paths.forEach(function(path) {
                            var sphere = new THREE.Mesh(new THREE.SphereGeometry(2.2, 20, 20), materials['PTM_' + ptm.modif.toLowerCase()]);
                            sphere.position.set(path[0].x, path[0].y, path[0].z);
                            sphere.scale.set(1, 1, 1);
                            sphere.overdraw = true;

                            glmol.modelGroup.add(sphere);
                        });

                    });
                    psms.forEach(function(psm) {
                        var paths = pdb.get3DPoints(psm.start, psm.end);
                        paths.forEach(function(path) {
                            var points = path.map(function(pt) {
                                return new THREE.Vector3(pt.x, pt.y, pt.z);
                            });
                            var spline = new THREE.SplineCurve3(points);
                            var tube = new THREE.TubeGeometry(spline, 150, 1.5, 10, false, true);
                            var pipe = new THREE.Mesh(tube, materials.PSM);

                            glmol.modelGroup.add(pipe);
                        });

                    });

                    /*
                     * init lights, one per chain
                     */
                    lights = _.chain(pdb.xref.chains).map(function(c) {
                        return c.name.split('/');
                    }).flatten().map(function() {

                        //var l = new THREE.PointLight(0xff0040, 2, 50);
                        //glmol.modelGroup.add(l);
                        var sphere = new THREE.SphereGeometry(1.2, 16, 8);

                        var l1 = new THREE.Mesh(sphere, new THREE.MeshBasicMaterial({
                            color : 0xff0000
                        }));
                        //l1.position = l.position;
                        glmol.modelGroup.add(l1);

                        return l1.position;
                    }).value();

                    glmol.show();
                });
            };

            var lightAt = function(pr) {
                if (pdb === undefined) {
                    return;
                }
                var aaPos = Math.round(pr);
                var paths = pdb.get3DPoints(aaPos, aaPos);
                var points = paths.map(function(path) {
                    return path[0];
                });
                if (points.length === 0) {
                    points = lights.map(function() {
                        return {
                            x : 10000,
                            y : 10000,
                            z : 10000
                        };
                    });
                }
                _.each(points, function(p, i) {
                    var pos = lights[i];
                    pos.x = p.x;
                    pos.y = p.y;
                    pos.z = p.z;
                });
                glmol.show();

            };
        });

        /**
         * take a basic tsv text content an returns a list of object. There are now clever guesses
         * @param {Object} content
         */
        var txt2tsv = function(content) {
            var lines = content.split('\n');
            var names = lines.shift().split(/\t/);
            var reContent = /\S/;
            return lines.filter(function(l) {
                return reContent.test(l);
            }).map(function(l) {
                var tl = l.split(/\t/);
                var ret = {};
                for (var i = 0; i < names.length; i++) {
                    ret[names[i]] = tl[i];
                }
                return ret;
            });
        };

        var PDB = ( function() {
                var PDB = function(content, xref) {
                    this.content = content;
                    this.xref = xref;

                    this.meta = {
                        id : xref.id
                    };
                    var reJournal = /\nJRNL .*/g;
                    this.meta.journal = {
                        AUTH : '',
                        DOI : '',
                        PMID : '',
                        REF : '',
                        TITL : ''
                    };
                    var m;
                    while (( m = reJournal.exec(content))) {
                        var field = m[0].substring(12, 17).trim();
                        var line = m[0].substring(19).trim();
                        if (this.meta.journal[field] === '') {
                            this.meta.journal[field] = line;
                        } else {
                            this.meta.journal[field] += ' ' + line;
                        }
                    }
                    this.meta.journal.AUTH = this.meta.journal.AUTH.replace(/,/g, ', ');
                    this.meta.journal.REF = this.meta.journal.REF.replace(/,\s+/g, ' ');

                    return this;
                };

                /**
                 * cleanup the PDB content, keeping only the meaningful chains for this XRef
                 */
                PDB.prototype.cleanupContent = function() {
                    var _this = this;

                    if (_this.cleanContent) {
                        return _this.cleanContent;
                    }
                    var okChains = {};
                    _this.xref.chains.forEach(function(c) {
                        c.name.split('/').forEach(function(d) {
                            okChains[d] = true;
                        });
                    });

                    var re1 = /^ATOM  /;
                    var re2 = /ATOM  .{15}(\w)(.{4}).{4}(.{8})(.{8})(.{8})/;
                    //var reSkip = /^HETATM/;

                    _this.cleanContent = _this.content.split('\n').filter(function(l) {
                        // if (reSkip.test(l)) {
                        // return false;
                        // }
                        if (!re1.test(l)) {
                            return true;
                        }
                        var m = re2.exec(l);
                        return okChains[m[1]];
                    }).join('\n');

                    return _this.cleanContent;
                };

                /*
                 * builds a map chain->position->3D
                 */
                PDB.prototype.sequence2pos = function() {
                    var _this = this;

                    if (_this._sequence2pos !== undefined) {
                        return _this._sequence2pos;
                    }

                    var re = /\nATOM  .{7}CA .{5}(\w)(.{4}).{4}(.{8})(.{8})(.{8})/g;
                    var m;
                    var allPos = [];
                    while (( m = re.exec(_this.cleanupContent()))) {
                        allPos.push({
                            chain : m[1].trim(),
                            pos : parseInt(m[2], 10) - 1,
                            x : parseFloat(m[3].trim()),
                            y : parseFloat(m[4]),
                            z : parseFloat(m[5])
                        });
                    }
                    var pos = _.chain(allPos).groupBy(function(p) {
                        return p.chain + ':' + p.pos;
                    }).map(function(gpos) {
                        var n = gpos.length;
                        return {
                            chain : gpos[0].chain,
                            pos : gpos[0].pos,
                            x : _.chain(gpos).pluck('x').reduce(function(memo, num) {
                                return memo + num;
                            }, 0).value() / n,
                            y : _.chain(gpos).pluck('y').reduce(function(memo, num) {
                                return memo + num;
                            }, 0).value() / n,
                            z : _.chain(gpos).pluck('z').reduce(function(memo, num) {
                                return memo + num;
                            }, 0).value() / n
                        };
                    }).value();

                    var ret = {};
                    var chains = _.uniq(_.pluck(pos, 'chain'));
                    _.each(chains, function(c) {
                        ret[c] = [];
                    });

                    var chainShift = {};
                    _this.content.split('\n').forEach(function(l) {
                        var m = /^DBREF\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)/.exec(l);
                        if (!m) {
                            return;
                        }
                        chainShift[m[2]] = parseInt(m[8], 10) - parseInt(m[3], 10);

                    });

                    _.each(pos, function(p) {
                        ret[p.chain][chainShift[p.chain] - 1 + p.pos] = p;
                    });

                    _this._sequence2pos = ret;
                    return _this._sequence2pos;
                };

                /**
                 * give the 3D path covering the sequence positions from to end, inclusive
                 * @param {Object} from
                 * @param {Object} end
                 * a list of sublist of adjacent 3D coordinates. There can be seeral of them because of gaps or different chains
                 */
                PDB.prototype.get3DPoints = function(from, end) {
                    var _this = this;

                    var ret = [];
                    var currentPath;
                    _.each(_this.sequence2pos(), function(pos) {
                        for (var i = from; i <= end; i++) {
                            if (pos[i] === undefined) {
                                currentPath = undefined;
                                continue;
                            }
                            if (currentPath === undefined) {
                                currentPath = [];
                                ret.push(currentPath);
                            }
                            currentPath.push(pos[i]);
                        }
                        currentPath = undefined;
                    });
                    return ret;
                };

                return PDB;
            }());
    }());
// var smokeTexture = THREE.ImageUtils.loadTexture('images/smoke.png');
// var smokeMaterial = new THREE.ParticleBasicMaterial({
// map : smokeTexture,
// transparent : true,
// blending : THREE.AdditiveBlending,
// size : 50,
// color : 0x111111
// });

// var smokeParticles = new THREE.Geometry();
// path.forEach(function(pt) {
// for (var i = 0; i < 100; i++) {
// var particle = new THREE .Vector3(Math.random() * 10 +pt.x-5, Math.random() * 10 +pt.y-5, Math.random() * 10 +pt.z-5);
// smokeParticles.vertices.push(particle);
// }
// });
// var smoke = new THREE.ParticleSystem(smokeParticles, smokeMaterial);
// smoke.sortParticles = true;
// glmol.modelGroup.add(smoke);
