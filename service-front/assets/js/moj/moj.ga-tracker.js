(function (global) {
  'use strict';

  var $ = global.jQuery;
  var GOVUK = global.GOVUK || {};

  var GoogleAnalyticsUniversalTracker = function (trackingId, fieldsObject) {
    this.trackerDomains = [];

    function configureProfile() {
      // https://developers.google.com/analytics/devguides/collection/analyticsjs/command-queue-reference#create
      sendToGa('create', trackingId, fieldsObject);
    }

    function anonymizeIp() {
      // https://developers.google.com/analytics/devguides/collection/analyticsjs/advanced#anonymizeip
      sendToGa('set', 'anonymizeIp', true);
    }

    function disableAdTracking() {
      // https://support.google.com/analytics/answer/2444872?hl=en
      sendToGa('set', 'displayFeaturesTask', null);
    }

    // Support legacy cookieDomain param
    if (typeof fieldsObject === 'string') {
      fieldsObject = { cookieDomain: fieldsObject };
    }

    configureProfile();
    anonymizeIp();
    disableAdTracking();
  };

  GoogleAnalyticsUniversalTracker.load = function () {
    /* eslint-disable */
        (function (i, s, o, g, r, a, m) { i['GoogleAnalyticsObject'] = r; i[r] = i[r] || function () {
            (i[r].q = i[r].q || []).push(arguments) }, i[r].l = 1 * new Date(); a = s.createElement(o),
            m = s.getElementsByTagName(o)[0]; a.async = 1; a.src = g; m.parentNode.insertBefore(a, m)
        })(global, document, 'script', 'https://www.google-analytics.com/analytics.js', 'ga')
        /* eslint-enable */
  };

  // https://developers.google.com/analytics/devguides/collection/analyticsjs/pages
  GoogleAnalyticsUniversalTracker.prototype.trackPageview = function (
    path,
    title,
    options,
  ) {
    var pageviewObject;

    if (typeof path === 'string') {
      pageviewObject = { page: path };
    }

    if (typeof title === 'string') {
      pageviewObject = pageviewObject || {};
      pageviewObject.title = title;
    }

    // Set an options object for the pageview (e.g. transport, sessionControl)
    // https://developers.google.com/analytics/devguides/collection/analyticsjs/field-reference#transport
    if (typeof options === 'object') {
      pageviewObject = $.extend(pageviewObject || {}, options);
    }

    var domain, i, l;
    if (!$.isEmptyObject(pageviewObject)) {
      sendToGa('send', 'pageview', pageviewObject);
      for (i = 0, l = this.trackerDomains.length; i < l; i++) {
        domain = this.trackerDomains[i];
        sendToGa(domain + '.send', 'pageview', pageviewObject);
      }
    } else {
      sendToGa('send', 'pageview');
      for (i = 0, l = this.trackerDomains.length; i < l; i++) {
        domain = this.trackerDomains[i];
        sendToGa(domain + '.send', 'pageview');
      }
    }
  };

  // https://developers.google.com/analytics/devguides/collection/analyticsjs/events
  GoogleAnalyticsUniversalTracker.prototype.trackEvent = function (
    category,
    action,
    options,
  ) {
    options = options || {};
    var value;
    var evt = {
      hitType: 'event',
      eventCategory: category,
      eventAction: action,
    };

    // Label is optional
    if (typeof options.label === 'string') {
      evt.eventLabel = options.label;
      delete options.label;
    }

    // Value is optional, but when used must be an
    // integer, otherwise the event will be invalid
    // and not logged
    if (options.value || options.value === 0) {
      value = parseInt(options.value, 10);
      if (typeof value === 'number' && !isNaN(value)) {
        options.eventValue = value;
      }
      delete options.value;
    }

    // Prevents an event from affecting bounce rate
    // https://developers.google.com/analytics/devguides/collection/analyticsjs/events#implementation
    if (options.nonInteraction) {
      options.nonInteraction = 1;
    }

    if (typeof options === 'object') {
      $.extend(evt, options);
    }

    sendToGa('send', evt);
  };

  /*
      https://developers.google.com/analytics/devguides/collection/analyticsjs/social-interactions
      network – The network on which the action occurs (e.g. Facebook, Twitter)
      action – The type of action that happens (e.g. Like, Send, Tweet)
      target – Specifies the target of a social interaction.
               This value is typically a URL but can be any text.
    */
  GoogleAnalyticsUniversalTracker.prototype.trackSocial = function (
    network,
    action,
    target,
    options,
  ) {
    var trackingOptions = {
      hitType: 'social',
      socialNetwork: network,
      socialAction: action,
      socialTarget: target,
    };

    $.extend(trackingOptions, options);

    sendToGa('send', trackingOptions);
  };

  /*
     https://developers.google.com/analytics/devguides/collection/analyticsjs/cross-domain
     trackerId - the UA account code to track the domain against
     name      - name for the tracker
     domain    - the domain to track
    */
  GoogleAnalyticsUniversalTracker.prototype.addLinkedTrackerDomain = function (
    trackerId,
    name,
    domain,
  ) {
    this.trackerDomains.push([name]);

    sendToGa('create', {
      trackingId: trackerId,
      cookieDomain: 'auto',
      name: name,
      allowLinker: true,
    });

    // Load the plugin.
    sendToGa(name + '.require', 'linker');

    // Define which domains to autoLink.
    domain = Array.isArray(domain) ? domain : [domain];
    sendToGa(name + '.linker:autoLink', domain);

    sendToGa(name + '.set', 'anonymizeIp', true);
    sendToGa(name + '.set', 'displayFeaturesTask', null);
  };

  // https://developers.google.com/analytics/devguides/collection/analyticsjs/custom-dims-mets
  GoogleAnalyticsUniversalTracker.prototype.setDimension = function (
    index,
    value,
  ) {
    sendToGa('set', 'dimension' + index, String(value));
  };

  function sendToGa() {
    if (typeof global.ga === 'function') {
      global.ga.apply(global, arguments);
    }
  }

  GOVUK.GoogleAnalyticsUniversalTracker = GoogleAnalyticsUniversalTracker;

  global.GOVUK = GOVUK;
})(window);
