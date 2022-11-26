import { isString, merge, isArray, forEach, isFunction, includes } from 'lodash'
import * as cheerio from 'cheerio'
const S = require('string')
const AutoLink = {}


AutoLink.link = (html, option) => {
	if (!html || !isString(html)) {
		return html;
	}
	var $ = cheerio.load(html, null, false);

	option = merge({
		target: false,
		attrs: {},
		ignore: {
			tags: ['a', 'pre', 'code', 'textarea', 'iframe'],
			classes: ['hljs'],
			fn: null
		},
		/**
		 *
		 * @param link {HTMLElement}
		 */
		onLink: (link) => {},
	}, option, function(a, b) {
		if (isArray(a) && isArray(b)) { // override tags/classes
			return b;
		}
	});

	var replaceURLWithHTMLLinks = function(text) {
		if (text) {
			text = text.replace(
				/((https?\:\/\/)|(www\.))(\S+)(\w{2,4})(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/gi,
				function(url){
					var full_url = url;
					if (!full_url.match('^https?:\/\/')) {
						full_url = 'http://' + full_url;
					}
					var link = cheerio.load('<a href="' + full_url + '">' + url + '</a>', null, false)('a');
					forEach(option.attrs, function(value, name) {
						link.attr(name, value);
					});
					if (option.target && isString(option.target)) {
						link.attr('target', option.target);
					}

					option.onLink(link, full_url)
					return $.html(link);
				}
			);
		}
		return text;
	};

	var noLink = function(ele) {
		if (isFunction(option.ignore.fn)) {
			return option.ignore.fn(ele);
		}
		if (!ele.contents().length) {
			return true;
		}
		if (includes(option.ignore.tags, ele[0].name)) {
			return true;
		}
		for (var i = option.ignore.classes.length - 1; i >= 0; i--) {
			var className = option.ignore.classes[i];
			if (ele.hasClass(className)) {
				return true;
			}
		}
		return false;
	};


	var parseLinks = function(node) {
		if (noLink(node)) {
			return node;
		}
		var newNode = node.clone();
		newNode.html('');
		node.contents().each(function() {
			if (this.type === 'text') {
				newNode.append(replaceURLWithHTMLLinks(S(this.data).escapeHTML().s));
			} else {
				var n = $(this);
				if (noLink(n)) {
					newNode.append(n);
				} else {
					newNode.append(parseLinks(n));
				}
			}
		});
		return newNode;
	};
	return parseLinks($.root()).html();
};


export default AutoLink
