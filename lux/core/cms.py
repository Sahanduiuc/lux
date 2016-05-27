from pulsar.apps.wsgi import Route

from lux.utils import absolute_uri

from .extension import app_attribute
from .templates import Template


HEAD_META = frozenset(('title', 'description', 'author', 'keywords'))


class Page:
    """An object representing an HTML page

    .. attribute:: name

        unique name of Page group (group name)

    .. attribute:: path

        pulsar pattern to match urls

    .. attribute:: body_template

        the outer body template

    .. attribute:: inner_template

        inner template

    .. attribute:: meta

        dictionary of page metadata
    """
    def __init__(self, name=None, path=None, body_template=None,
                 inner_template=None, meta=None, urlargs=None):
        self.name = name
        self.path = path
        self.body_template = body_template
        self.inner_template = inner_template
        self.meta = dict(meta or ())
        self.urlargs = urlargs

    def __repr__(self):
        return self.name or self.__class__.__name__
    __str__ = __repr__

    def render_inner(self, request):
        return self.render(request, self.inner_template)

    def render(self, request, template):
        if template:
            app = request.app
            context = app.context(request)
            context.update(self.meta)
            return template.render(app, context)
        return ''

    def copy(self):
        return self.__copy__()

    def __copy__(self):
        cls = self.__class__
        page = cls.__new__(cls)
        page.__dict__ = self.__dict__.copy()
        page.meta = self.meta.copy()
        return page


class CMS:
    """Lux CMS base class.

    .. attribute:: app

        lux :class:`.Application`
    """
    html_main_key = '{{ html_main }}'

    def __init__(self, app):
        self.app = app

    @property
    def config(self):
        return self.app.config

    def page(self, path):
        """Obtain a page object from a request path.

        This method always return a :class:`.Page`. If no
        registered pages match the path, it returns an empty :class:`.Page`.
        """
        return self.match(path) or Page()

    def as_page(self, page=None):
        if not isinstance(page, Page):
            page = Page(body_template=page)
        return page

    def inner_html(self, request, page, inner_html):
        '''Render the inner part of the page template (``html_main``)

        ``html`` is the html rendered by the Router, indipendently from the
        CMS layout. It can be en empty string.
        '''
        return self.replace_html_main(page.inner_template, inner_html)

    def match(self, path):
        '''Match a path with a page form :meth:`.sitemap`

        It returns Nothing if no page is matched
        '''
        for route, page in self.sitemap():
            matched = route.match(path)
            if matched is not None and '__remaining__' not in matched:
                page = page.copy()
                page.urlargs = matched
                return page

    def sitemap(self):
        return app_sitemap(self.app)

    def render_body(self, request, page, context):
        meta = page.meta
        doc = request.html_document
        doc.meta.update({
            'og:image': absolute_uri(request, meta.pop('image', None)),
            'og:published_time': meta.pop('date', None),
            'og:modified_time': meta.pop('modified', None)
        })

        if meta.pop('priority', None) == 0:
            doc.meta['head_robots'] = ['noindex', 'nofollow']
        #
        # Add head keys
        head = {}
        page_meta = {}
        for key, value in meta.items():
            bits = key.split('_', 1)
            if len(bits) == 2 and bits[0] == 'head':
                # when using file based content __ is replaced by :
                key = bits[1].replace('__', ':')
                head[key] = value
                doc.meta.set(key, value)
            else:
                page_meta[key] = value

        # Add head keys if needed
        for key in HEAD_META:
            if key not in head and key in page_meta:
                doc.meta.set(key, page_meta[key])

        doc.jscontext['page'] = page_meta
        html_main = self.replace_html_main(page.body_template,
                                           page.inner_template)
        return html_main.render(self.app, context)

    def context(self, request, context):
        """Context dictionary for this cms
        """
        return ()

    def replace_html_main(self, template, html_main):
        if not isinstance(template, Template):
            template = self.app.template(template)

        if template:
            if html_main:
                html_main = template.replace(self.html_main_key, html_main)
            else:
                html_main = template

        return Template(html_main)


@app_attribute
def app_sitemap(app):
    """Build and store HTML sitemap in the application
    """
    groups = app.config['CONTENT_GROUPS']
    if not isinstance(groups, dict):
        return []
    paths = {}
    variables = {}

    for name, page in groups.items():
        if not isinstance(page, dict):
            continue
        page = page.copy()
        path = page.pop('path', None)
        if not path:
            continue
        if path == '*':
            path = ''
        if path.startswith('/'):
            path = path[1:]
        if path.endswith('/'):
            path = path[:-1]
        page['name'] = name
        page = Page(path=path, **page)

        if not path or path.startswith('<'):
            variables[path] = page
            continue
        paths[path] = page
        paths['%s/<path:path>' % path] = page

    sitemap = [(Route(path), paths[path]) for path in reversed(sorted(paths))]

    for path in reversed(sorted(variables)):
        sitemap.append((Route(path or '<path:path>'), variables[path]))
        if path:
            sitemap.append((Route('%s/<path:path>' % path), variables[path]))

    return sitemap
