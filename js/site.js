window.SolrApp = {
  perPage: 24,
  facets: ['type', 'categories', 'manufacturer', 'price'],

  facet_labels: {
    categories: 'Category',
    brand: 'Brand',
    price: 'Price',
    type: 'Type'
  },

  slider: ['price'],

  // DOM elements
  searchInput: $('.js-search-input'),
  searchInputIcon: $('.js-search-icon'),
  main: $('.js-content'),
  sortBySelect: $('#sort-by-select'),
  products: $('.js-product-list'),
  stats: $('.js-stats'),
  facets: $('.js-facets'),
  pagination: $('.js-pagination'),

  // templates
  productTemplate: Hogan.compile($('#product-template').text()),
  statsTemplate: Hogan.compile($('#stats-template').text()),
  facetTemplate: Hogan.compile($('#facet-template').text()),
  sliderTemplate: Hogan.compile($('#slider-template').text()),
  paginationTemplate: Hogan.compile($('#pagination-template').text()),
  noResultsTemplate: Hogan.compile($('#no-results-template').text()),

  search: function(q) {
    $.ajax({
      url: "http://localhost:8983/solr/products/query?rows=24&q=" + q,
      dataType: 'jsonp',
      jsonp: 'json.wrf',
      success: SolrApp.handleResponse,
      error: SolrApp.handleError,
    });
  },

  init: function() {
    SolrApp.registerEvents();
  },

  registerEvents: function() {
    SolrApp.searchInput.on('input propertychange', function(e) {
      query = e.currentTarget.value;
      SolrApp.toggleIconEmptyInput(query);
      SolrApp.search(query);
    })
    .focus();

    $(document).on('click', '.go-to-page', function(e) {
      e.preventDefault();
      $('html, body').animate({ scrollTop: 0 }, '500', 'swing');
      var newQuery = query + "&start=" + (+$(this).data('page') - 1) * SolrApp.perPage;
      SolrApp.search(newQuery);
    });
  },

  toggleIconEmptyInput: function(query) {
    SolrApp.searchInputIcon.toggleClass('empty', query.trim() !== '');
  },

  handleError: function(error) {
    console.log(error);
  },

  handleResponse: function(resp) {
    var response = resp.response;
    var responseHeader = resp.response;

    SolrApp.renderStats(response, responseHeader);
    SolrApp.renderProducts(response);
    SolrApp.renderPagination(response);
    // renderFacets(resp, state);
    // bindSearchObjects(state);
   // handleNoResults(response);
  },

  // render helpers
  renderStats: function(resp, respHeader) {
    var stats = {
      numFound: resp.numFound,
      numFoundPlural: resp.numFound !== 1,
      qTime: respHeader.QTime
    };
    SolrApp.stats.html(SolrApp.statsTemplate.render(stats));
  },

  renderProducts: function(resp) {
    SolrApp.products.html(SolrApp.productTemplate.render(resp));
  },

  renderPagination: function(resp) {
    var pages = [];
    var perPage = SolrApp.perPage;
    var page = Math.ceil(resp.start / perPage);
    var numPages = Math.ceil(resp.numFound / perPage);

    if (page > 3) {
      pages.push({ current: false, number: 1 });
      pages.push({ current: false, number: '...', disabled: true });
    }

    for (var p = page - 3; p < page + 3; ++p) {
      if (p < 0 || p >= numPages) continue;
      pages.push({ current: page === p, number: p + 1 });
    }

    if (page + 3 < numPages) {
      pages.push({ current: false, number: '...', disabled: true });
      pages.push({ current: false, number: numPages });
    }

    var pagination = {
      pages: pages,
      prev_page: page > 0 ? page : false,
      next_page: page + 1 < numPages ? page + 2 : false
    };

    SolrApp.pagination.html(SolrApp.paginationTemplate.render(pagination));
  },

};

$(function() {
  SolrApp.init();
});









/*




    // template bindings
    var query;

    // Input binding
    $searchInput.on('input propertychange', function(e) {
      query = e.currentTarget.value;
      toggleIconEmptyInput(query);
      SolrApp.search(query);
    })
    .focus();


    $(document).on('click', '.toggle-refine', function(e) {
      e.preventDefault();
      algoliaHelper.toggleRefine($(this).data('facet'), $(this).data('value')).search();
    });


    $sortBySelect.on('change', function(e) {
      e.preventDefault();
      algoliaHelper.setIndex(INDEX_NAME + $(this).val()).search();
    });

    $searchInputIcon.on('click', function(e) {
      e.preventDefault();
      $searchInput.val('').keyup().focus();
    });
    $(document).on('click', '.remove-numeric-refine', function(e) {
      e.preventDefault();
      algoliaHelper.removeNumericRefinement($(this).data('facet'), $(this).data('value')).search();
    });
    $(document).on('click', '.clear-all', function(e) {
      e.preventDefault();
      $searchInput.val('').focus();
      SolrApp.search();
    });
    window.addEventListener('popstate', function() {
      SolrApp.initFromURLParams();
      SolrApp.search();
    });

    // Initial search
    SolrApp.initFromURLParams();
    SolrApp.search();
  },

  

  
  renderFacets: function(content, state) {
    var facetsHtml = '';
    for (var facetIndex = 0; facetIndex < FACETS_ORDER_OF_DISPLAY.length; ++facetIndex) {
      var facetName = FACETS_ORDER_OF_DISPLAY[facetIndex];
      var facetResult = content.getFacetByName(facetName);
      if (!facetResult) continue;
      var facetContent = {};

      // Slider facets
      if ($.inArray(facetName, FACETS_SLIDER) !== -1) {
        facetContent = {
          facet: facetName,
          title: FACETS_LABELS[facetName]
        };
        facetContent.min = facetResult.stats.min;
        facetContent.max = facetResult.stats.max;
        var from = state.getNumericRefinement(facetName, '>=') || facetContent.min;
        var to = state.getNumericRefinement(facetName, '<=') || facetContent.max;
        facetContent.from = Math.min(facetContent.max, Math.max(facetContent.min, from));
        facetContent.to = Math.min(facetContent.max, Math.max(facetContent.min, to));
        facetsHtml += sliderTemplate.render(facetContent);
      } else {
        facetContent = {
          facet: facetName,
          title: FACETS_LABELS[facetName],
          values: content.getFacetValues(facetName, { sortBy: ['isRefined:desc', 'count:desc'] }),
          disjunctive: $.inArray(facetName, PARAMS.disjunctiveFacets) !== -1
        };
        facetsHtml += facetTemplate.render(facetContent);
      }
    }
    $facets.html(facetsHtml);
  },

  bindSearchObjects: function(state) {
  // Bind Sliders
  for (facetIndex = 0; facetIndex < FACETS_SLIDER.length; ++facetIndex) {
    var facetName = FACETS_SLIDER[facetIndex];

    var slider = $('#' + facetName + '-slider');

    var sliderOptions = {
      type: 'double',
      grid: true,
      min: slider.data('min'),
      max: slider.data('max'),
      from: slider.data('from'),
      to: slider.data('to'),
      prettify: function(num) {
        return '$' + parseInt(num, 10);
      },
      onFinish: function(data) {
        var lowerBound = state.getNumericRefinement(facetName, '>=');
        lowerBound = lowerBound && lowerBound[0] || data.min;
        if (data.from !== lowerBound) {
          algoliaHelper.removeNumericRefinement(facetName, '>=');
          algoliaHelper.addNumericRefinement(facetName, '>=', data.from).search();
        }
        var upperBound = state.getNumericRefinement(facetName, '<=');
        upperBound = upperBound && upperBound[0] || data.max;
        if (data.to !== upperBound) {
          algoliaHelper.removeNumericRefinement(facetName, '<=');
          algoliaHelper.addNumericRefinement(facetName, '<=', data.to).search();
        }
      }
    };
    slider.ionRangeSlider(sliderOptions);
  }
},

  handleNoResults: function(content) {
    if (content.numFound > 0) {
      $main.removeClass('no-results');
      return;
    }
    $main.addClass('no-results');

    var filters = [];
    var i;
    var j;
    for (i in algoliaHelper.state.facetsRefinements) {
      filters.push({
        class: 'toggle-refine',
        facet: i,
        facet_value: algoliaHelper.state.facetsRefinements[i],
        label: FACETS_LABELS[i] + ': ',
        label_value: algoliaHelper.state.facetsRefinements[i]
      });
    }
    for (i in algoliaHelper.state.disjunctiveFacetsRefinements) {
      for (j in algoliaHelper.state.disjunctiveFacetsRefinements[i]) {
        filters.push({
          class: 'toggle-refine',
          facet: i,
          facet_value: algoliaHelper.state.disjunctiveFacetsRefinements[i][j],
          label: FACETS_LABELS[i] + ': ',
          label_value: algoliaHelper.state.disjunctiveFacetsRefinements[i][j]
        });
      }
    }
    for (i in algoliaHelper.state.numericRefinements) {
      for (j in algoliaHelper.state.numericRefinements[i]) {
        filters.push({
          class: 'remove-numeric-refine',
          facet: i,
          facet_value: j,
          label: FACETS_LABELS[i] + ' ',
          label_value: j + ' ' + algoliaHelper.state.numericRefinements[i][j]
        });
      }
    }
    $hits.html(noResultsTemplate.render({ query: content.query, filters: filters }));
  },

  initFromUrlParams: function() {
    var URLString = window.location.search.slice(1);
    var URLParams = algoliasearchHelper.url.getStateFromQueryString(URLString);
    if (URLParams.query) $searchInput.val(URLParams.query);
    if (URLParams.index) $sortBySelect.val(URLParams.index.replace(INDEX_NAME, ''));
    algoliaHelper.overrideStateWithoutTriggeringChangeEvent(algoliaHelper.state.setQueryParameters(URLParams));
  },

  setURLParams: function() {
    var URLHistoryTimer = Date.now();
    var URLHistoryThreshold = 700;

    var trackedParameters = ['attribute:*'];
    if (algoliaHelper.state.query.trim() !== '') trackedParameters.push('query');
    if (algoliaHelper.state.page !== 0) trackedParameters.push('page');
    if (algoliaHelper.state.index !== INDEX_NAME) trackedParameters.push('index');

    var URLParams = window.location.search.slice(1);
    var nonAlgoliaURLParams = algoliasearchHelper.url.getUnrecognizedParametersInQueryString(URLParams);
    var nonAlgoliaURLHash = window.location.hash;
    var helperParams = algoliaHelper.getStateAsQueryString({ filters: trackedParameters, moreAttributes: nonAlgoliaURLParams });
    if (URLParams === helperParams) return;

    var now = Date.now();
    if (URLHistoryTimer > now) {
      window.history.replaceState(null, '', '?' + helperParams + nonAlgoliaURLHash);
    } else {
      window.history.pushState(null, '', '?' + helperParams + nonAlgoliaURLHash);
    }
    URLHistoryTimer = now + URLHistoryThreshold;
  },

  

  

  */