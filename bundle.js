
(function(l, i, v, e) { v = l.createElement(i); v.async = 1; v.src = '//' + (location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; e = l.getElementsByTagName(i)[0]; e.parentNode.insertBefore(v, e)})(document, 'script');
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_data(text, data) {
        data = '' + data;
        if (text.data !== data)
            text.data = data;
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error(`Function called outside component initialization`);
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    function createEventDispatcher() {
        const component = current_component;
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function flush() {
        const seen_callbacks = new Set();
        do {
            // first, call beforeUpdate functions
            // and update components
            while (dirty_components.length) {
                const component = dirty_components.shift();
                set_current_component(component);
                update(component.$$);
            }
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    callback();
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
    }
    function update($$) {
        if ($$.fragment) {
            $$.update($$.dirty);
            run_all($$.before_update);
            $$.fragment.p($$.dirty, $$.ctx);
            $$.dirty = null;
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        if (component.$$.fragment) {
            run_all(component.$$.on_destroy);
            component.$$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            component.$$.on_destroy = component.$$.fragment = null;
            component.$$.ctx = {};
        }
    }
    function make_dirty(component, key) {
        if (!component.$$.dirty) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty = blank_object();
        }
        component.$$.dirty[key] = true;
    }
    function init(component, options, instance, create_fragment, not_equal, prop_names) {
        const parent_component = current_component;
        set_current_component(component);
        const props = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props: prop_names,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty: null
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, props, (key, value) => {
                if ($$.ctx && not_equal($$.ctx[key], $$.ctx[key] = value)) {
                    if ($$.bound[key])
                        $$.bound[key](value);
                    if (ready)
                        make_dirty(component, key);
                }
            })
            : props;
        $$.update();
        ready = true;
        run_all($$.before_update);
        $$.fragment = create_fragment($$.ctx);
        if (options.target) {
            if (options.hydrate) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment.l(children(options.target));
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
    }

    /* src\components\ImageView.svelte generated by Svelte v3.6.7 */

    const file = "src\\components\\ImageView.svelte";

    function create_fragment(ctx) {
    	var div, img, img_src_value, dispose;

    	return {
    		c: function create() {
    			div = element("div");
    			img = element("img");
    			attr(img, "class", "image svelte-1ph7knk");
    			attr(img, "src", img_src_value = `https://picsum.photos/id/${ctx.imageId}/${ctx.width}/${ctx.height}`);
    			attr(img, "alt", ctx.alt);
    			add_location(img, file, 25, 2, 558);
    			add_location(div, file, 24, 0, 488);
    			dispose = listen(div, "click", ctx.click_handler);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, div, anchor);
    			append(div, img);
    		},

    		p: function update(changed, ctx) {
    			if ((changed.imageId || changed.width || changed.height) && img_src_value !== (img_src_value = `https://picsum.photos/id/${ctx.imageId}/${ctx.width}/${ctx.height}`)) {
    				attr(img, "src", img_src_value);
    			}

    			if (changed.alt) {
    				attr(img, "alt", ctx.alt);
    			}
    		},

    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div);
    			}

    			dispose();
    		}
    	};
    }

    function instance($$self, $$props, $$invalidate) {
    	let { width = 300, height = width, imageId = 0, alt = "an image", src = "" } = $$props;

      const dispatch = createEventDispatcher();

    	const writable_props = ['width', 'height', 'imageId', 'alt', 'src'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<ImageView> was created with unknown prop '${key}'`);
    	});

    	function click_handler() {
    		return dispatch('showImage', { imageSource: src });
    	}

    	$$self.$set = $$props => {
    		if ('width' in $$props) $$invalidate('width', width = $$props.width);
    		if ('height' in $$props) $$invalidate('height', height = $$props.height);
    		if ('imageId' in $$props) $$invalidate('imageId', imageId = $$props.imageId);
    		if ('alt' in $$props) $$invalidate('alt', alt = $$props.alt);
    		if ('src' in $$props) $$invalidate('src', src = $$props.src);
    	};

    	return {
    		width,
    		height,
    		imageId,
    		alt,
    		src,
    		dispatch,
    		click_handler
    	};
    }

    class ImageView extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, ["width", "height", "imageId", "alt", "src"]);
    	}

    	get width() {
    		throw new Error("<ImageView>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set width(value) {
    		throw new Error("<ImageView>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get height() {
    		throw new Error("<ImageView>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set height(value) {
    		throw new Error("<ImageView>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get imageId() {
    		throw new Error("<ImageView>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set imageId(value) {
    		throw new Error("<ImageView>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get alt() {
    		throw new Error("<ImageView>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set alt(value) {
    		throw new Error("<ImageView>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get src() {
    		throw new Error("<ImageView>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set src(value) {
    		throw new Error("<ImageView>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\App.svelte generated by Svelte v3.6.7 */

    const file$1 = "src\\App.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.imageItem = list[i];
    	return child_ctx;
    }

    // (130:6) {#each imageList as imageItem}
    function create_each_block(ctx) {
    	var current;

    	var imageview = new ImageView({
    		props: {
    		width: "300",
    		height: "200",
    		imageId: ctx.imageItem.id,
    		alt: ctx.imageItem.author,
    		src: ctx.imageItem.download_url
    	},
    		$$inline: true
    	});
    	imageview.$on("showImage", ctx.onImageClicked);

    	return {
    		c: function create() {
    			imageview.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			mount_component(imageview, target, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var imageview_changes = {};
    			if (changed.imageList) imageview_changes.imageId = ctx.imageItem.id;
    			if (changed.imageList) imageview_changes.alt = ctx.imageItem.author;
    			if (changed.imageList) imageview_changes.src = ctx.imageItem.download_url;
    			imageview.$set(imageview_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(imageview.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(imageview.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(imageview, detaching);
    		}
    	};
    }

    // (143:6) {:else}
    function create_else_block(ctx) {
    	var div;

    	return {
    		c: function create() {
    			div = element("div");
    			attr(div, "class", "svelte-1cho4o7");
    			add_location(div, file$1, 143, 8, 2800);
    		},

    		m: function mount(target, anchor) {
    			insert(target, div, anchor);
    		},

    		p: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div);
    			}
    		}
    	};
    }

    // (141:6) {#if page > 1}
    function create_if_block_1(ctx) {
    	var button, t0, t1_value = ctx.page - 1, t1, dispose;

    	return {
    		c: function create() {
    			button = element("button");
    			t0 = text("‹‹ ");
    			t1 = text(t1_value);
    			attr(button, "class", "svelte-1cho4o7");
    			add_location(button, file$1, 141, 8, 2710);
    			dispose = listen(button, "click", ctx.onClickBack);
    		},

    		m: function mount(target, anchor) {
    			insert(target, button, anchor);
    			append(button, t0);
    			append(button, t1);
    		},

    		p: function update(changed, ctx) {
    			if ((changed.page) && t1_value !== (t1_value = ctx.page - 1)) {
    				set_data(t1, t1_value);
    			}
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(button);
    			}

    			dispose();
    		}
    	};
    }

    // (151:2) {#if overlayVisible}
    function create_if_block(ctx) {
    	var div, dispose;

    	return {
    		c: function create() {
    			div = element("div");
    			attr(div, "class", "overlay svelte-1cho4o7");
    			attr(div, "style", ctx.overlayStyle);
    			add_location(div, file$1, 151, 4, 2966);
    			dispose = listen(div, "click", ctx.click_handler);
    		},

    		m: function mount(target, anchor) {
    			insert(target, div, anchor);
    		},

    		p: function update(changed, ctx) {
    			if (changed.overlayStyle) {
    				attr(div, "style", ctx.overlayStyle);
    			}
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div);
    			}

    			dispose();
    		}
    	};
    }

    function create_fragment$1(ctx) {
    	var div5, div0, h1, t1, div4, div1, t2, div3, t3, div2, t4, t5, button, t6_value = ctx.page + 1, t6, t7, t8, current, dispose;

    	var each_value = ctx.imageList;

    	var each_blocks = [];

    	for (var i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	function select_block_type(ctx) {
    		if (ctx.page > 1) return create_if_block_1;
    		return create_else_block;
    	}

    	var current_block_type = select_block_type(ctx);
    	var if_block0 = current_block_type(ctx);

    	var if_block1 = (ctx.overlayVisible) && create_if_block(ctx);

    	return {
    		c: function create() {
    			div5 = element("div");
    			div0 = element("div");
    			h1 = element("h1");
    			h1.textContent = "Svelte Example Lorem Picsum";
    			t1 = space();
    			div4 = element("div");
    			div1 = element("div");

    			for (var i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t2 = space();
    			div3 = element("div");
    			if_block0.c();
    			t3 = space();
    			div2 = element("div");
    			t4 = text(ctx.page);
    			t5 = space();
    			button = element("button");
    			t6 = text(t6_value);
    			t7 = text(" ››");
    			t8 = space();
    			if (if_block1) if_block1.c();
    			attr(h1, "class", "svelte-1cho4o7");
    			add_location(h1, file$1, 124, 4, 2283);
    			attr(div0, "class", "header svelte-1cho4o7");
    			add_location(div0, file$1, 123, 2, 2258);
    			attr(div1, "class", "images svelte-1cho4o7");
    			add_location(div1, file$1, 128, 4, 2360);
    			attr(div2, "class", "svelte-1cho4o7");
    			add_location(div2, file$1, 145, 6, 2826);
    			attr(button, "class", "svelte-1cho4o7");
    			add_location(button, file$1, 146, 6, 2850);
    			attr(div3, "class", "buttons svelte-1cho4o7");
    			add_location(div3, file$1, 139, 4, 2659);
    			attr(div4, "class", "container svelte-1cho4o7");
    			add_location(div4, file$1, 127, 2, 2332);
    			attr(div5, "class", "content svelte-1cho4o7");
    			add_location(div5, file$1, 122, 0, 2234);
    			dispose = listen(button, "click", ctx.onClickNext);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, div5, anchor);
    			append(div5, div0);
    			append(div0, h1);
    			append(div5, t1);
    			append(div5, div4);
    			append(div4, div1);

    			for (var i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div1, null);
    			}

    			append(div4, t2);
    			append(div4, div3);
    			if_block0.m(div3, null);
    			append(div3, t3);
    			append(div3, div2);
    			append(div2, t4);
    			append(div3, t5);
    			append(div3, button);
    			append(button, t6);
    			append(button, t7);
    			append(div5, t8);
    			if (if_block1) if_block1.m(div5, null);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (changed.imageList) {
    				each_value = ctx.imageList;

    				for (var i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(changed, child_ctx);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div1, null);
    					}
    				}

    				group_outros();
    				for (i = each_value.length; i < each_blocks.length; i += 1) out(i);
    				check_outros();
    			}

    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block0) {
    				if_block0.p(changed, ctx);
    			} else {
    				if_block0.d(1);
    				if_block0 = current_block_type(ctx);
    				if (if_block0) {
    					if_block0.c();
    					if_block0.m(div3, t3);
    				}
    			}

    			if (!current || changed.page) {
    				set_data(t4, ctx.page);
    			}

    			if ((!current || changed.page) && t6_value !== (t6_value = ctx.page + 1)) {
    				set_data(t6, t6_value);
    			}

    			if (ctx.overlayVisible) {
    				if (if_block1) {
    					if_block1.p(changed, ctx);
    				} else {
    					if_block1 = create_if_block(ctx);
    					if_block1.c();
    					if_block1.m(div5, null);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			for (var i = 0; i < each_value.length; i += 1) transition_in(each_blocks[i]);

    			current = true;
    		},

    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);
    			for (let i = 0; i < each_blocks.length; i += 1) transition_out(each_blocks[i]);

    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div5);
    			}

    			destroy_each(each_blocks, detaching);

    			if_block0.d();
    			if (if_block1) if_block1.d();
    			dispose();
    		}
    	};
    }

    function instance$1($$self, $$props, $$invalidate) {
    	

      let { page = 1, limit = 6 } = $$props;

      let overlayVisible = false;
      let imageList = [];
      let overlayImageUrl = "";

      onMount(() => {
        loadImageList();
      });

      const loadImageList = async () => {
        const req = await fetch(
          `https://picsum.photos/v2/list?page=${page}&limit=${limit}`
        );

        const json = await req.json();
        $$invalidate('imageList', imageList = json);
      };

      const onClickNext = async () => {
        page++; $$invalidate('page', page);
        loadImageList();
      };

      const onClickBack = async () => {
        if (page === 1) return;

        page--; $$invalidate('page', page);
        loadImageList();
      };

      const onImageClicked = event => {
        $$invalidate('overlayImageUrl', overlayImageUrl = event.detail.imageSource);
        $$invalidate('overlayVisible', overlayVisible = true);
      };

    	const writable_props = ['page', 'limit'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	function click_handler(evt) {
    		const $$result = (overlayVisible = false);
    		$$invalidate('overlayVisible', overlayVisible);
    		return $$result;
    	}

    	$$self.$set = $$props => {
    		if ('page' in $$props) $$invalidate('page', page = $$props.page);
    		if ('limit' in $$props) $$invalidate('limit', limit = $$props.limit);
    	};

    	let overlayStyle;

    	$$self.$$.update = ($$dirty = { overlayVisible: 1, overlayImageUrl: 1 }) => {
    		if ($$dirty.overlayVisible || $$dirty.overlayImageUrl) { $$invalidate('overlayStyle', overlayStyle = overlayVisible
            ? `background-image: url("${overlayImageUrl}");`
            : ""); }
    	};

    	return {
    		page,
    		limit,
    		overlayVisible,
    		imageList,
    		onClickNext,
    		onClickBack,
    		onImageClicked,
    		overlayStyle,
    		click_handler
    	};
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, ["page", "limit"]);
    	}

    	get page() {
    		throw new Error("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set page(value) {
    		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get limit() {
    		throw new Error("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set limit(value) {
    		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {}
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
