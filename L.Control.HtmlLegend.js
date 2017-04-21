L.Control.HtmlLegend = L.Control.extend({
    _map: null,
    _activeLayers: 0,
    _alwaysShow: false,
    options: {
        position: 'topright',
        legends: [],   // array of legend entries - see README for format
        collapseSimple: false,  // if true, legend entries that are from a simple renderer will use compact presentation
        detectStretched: false,  // if true, will test to see if legend entries look stretched.  These are usually in sets of 3 with the middle element having no label.
        layersOpacity: {
            defaultValue: 1,
            sliderIcons: {
                visible: 'fa fa-eye',
                hidden: 'fa fa-eye-slash'
            }
        }
    },

    onAdd: function (map) {
        this._map = map;
        this._container = L.DomUtil.create('div', 'leaflet-control leaflet-bar leaflet-html-legend');

        // Disable events on container
        L.DomEvent.disableClickPropagation(this._container);
        if (!L.Browser.touch) {
            L.DomEvent.disableScrollPropagation(this._container);
        }

        this.render();

        return this._container;
    },

    render: function () {
        L.DomUtil.empty(this._container);

        this.options.legends.forEach(function (legend) {
            if (!legend.elements) {
                return
            }

            var elements = legend.elements;

            var className = 'legend-block';

            if (this.options.detectStretched) {
                if (elements.length === 3 && elements[0].label !== '' && elements[1].label === '' && elements[2].label !== '') {
                    className += ' legend-stretched';
                }
            }

            var block = L.DomUtil.create('div', className, this._container);

            if (this.options.collapseSimple && elements.length === 1 && !elements[0].label) {
                this._addElement(elements[0].html, legend.name, elements[0].style, block);
                this._connectLayer(block, legend);
                return;
            }

            if (legend.name) {
                var header = L.DomUtil.create('h4', null, block);
                L.DomUtil.create('div', 'legend-caret', header);
                L.DomUtil.create('span', null, header).innerHTML = legend.name;

                L.DomEvent.on(header, 'click', function () {
                    if (L.DomUtil.hasClass(header, 'closed')) {
                        L.DomUtil.removeClass(header, 'closed');
                    }
                    else {
                        L.DomUtil.addClass(header, 'closed');
                    }
                }, this);
            }

            var elementContainer = L.DomUtil.create('div', 'legend-elements', block);

            elements.forEach(function (element) {
                this._addElement(element.html, element.label, element.style, elementContainer);
            }, this);

            this._connectLayer(block, legend);

        }, this);

        this._checkVisibility();
    },

    _addElement: function (html, label, style, container) {
        var row = L.DomUtil.create('div', 'legend-row', container);
        var symbol = L.DomUtil.create('span', 'symbol', row);
        for (var k in style) {
            symbol.style[k] = style[k];
        }
        symbol.innerHTML = html;
        if (!!label) {
            L.DomUtil.create('label', null, row).innerHTML = label;
        }
    },

    _connectLayer: function (container, legend) {
        var layer = legend.layer;

        if (!layer) {
            this._alwaysShow = true;
            return
        }

        var opacity = 1 - (layer.opacity || this.options.layersOpacity.defaultValue || 0);
        if (typeof layer.setOpacity === 'function') {
            layer.setOpacity(opacity);
        } else if (typeof layer.setStyle === 'function') {
            layer.setStyle({opacity: opacity});
        }

        if (this._map.hasLayer(layer)) {
            this._activeLayers++;
        } else {
            container.style.display = 'none';
        }

        container.classList.add('layer-control');

        var opacityController = L.DomUtil.create('span', 'opacity-slider', container);

        L.DomUtil.create('span', 'slider-label', opacityController).innerHTML = 'Transparency:';

        L.DomUtil.create('i', this.options.layersOpacity.sliderIcons.visible, opacityController).classList.add('icon');

        var opacitySlider = L.DomUtil.create('input', null, opacityController);
        opacitySlider.type = 'range';
        opacitySlider.min = 0;
        opacitySlider.max = 1;
        opacitySlider.step = 0.1;
        opacitySlider.onchange = function (e) {
            var opacity = 1 - e.target.value || 0;

            if (typeof layer.setOpacity === 'function') {
                layer.setOpacity(opacity);
            } else if (typeof layer.setStyle === 'function') {
                layer.setStyle({opacity: opacity});
            }
        }.bind(this);
        opacitySlider.value = layer.opacity || this.options.layersOpacity.defaultValue || 0;

        L.DomUtil.create('i', this.options.layersOpacity.sliderIcons.hidden, opacityController).classList.add('icon');

        map.on('layeradd', function (e) {
            if (e.layer == layer) {
                this._activeLayers++;
                container.style.display = '';
                this._checkVisibility();
            }
        }.bind(this)).on('layerremove', function (e) {
            if (e.layer == layer) {
                this._activeLayers--;
                container.style.display = 'none';
                this._checkVisibility();
            }
        }.bind(this));
    },

    _checkVisibility: function () {
        if (this._alwaysShow || this._activeLayers) {
            this._container.style.display = '';
        } else {
            this._container.style.display = 'none';
        }
    }
});

L.control.htmllegend = function (options) {
    return new L.Control.HtmlLegend(options);
};