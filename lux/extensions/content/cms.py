from pulsar.utils.structures import AttributeDictionary
from pulsar import Http404

from lux.extensions.sitemap import Sitemap, SitemapIndex
from lux.extensions.rest import api_path
from lux.core import cached, Template
from lux import core

from .contents import get_reader


class CMSRouter(core.HtmlRouter):
    """Fallback CMS Router
    """
    def get_html(self, request):
        # This method is called when no other Router matched the path
        # in request. This means if no content is available will result
        # in 404 response
        request.cache.cms_router = True
        return ''


class CMSmap(SitemapIndex):
    """Build the sitemap for this Content Management System
    """
    def items(self, request):
        middleware = request.app._handler.middleware
        for map in middleware:
            if isinstance(map, RouterMap):
                url = request.absolute_uri(str(map.route))
                _, last_modified = map.sitemap(request)
                yield AttributeDictionary(loc=url, lastmod=last_modified)


class RouterMap(Sitemap):
    name = None

    def items(self, request):
        cms = request.app.cms
        for item in cms.all(request, self.name):
            html_url = request.absolute_uri(item['path'])
            yield AttributeDictionary(loc=html_url,
                                      lastmod=item.get('modified'),
                                      priority=item.get('priority', 1))


class CMS(core.CMS):
    """Override default lux :class:`.CMS` handler

    This CMS handler reads page information from the database and
    """
    def __init__(self, app):
        super().__init__(app)
        middleware = app._handler.middleware
        processed = set()
        middleware.append(CMSmap('/sitemap.xml', cms=self))
        for route, page in self.sitemap():
            if page.name in processed:
                continue
            url = '%s/sitemap.xml' % page.path if page.path else 'sitemap1.xml'
            sitemap = RouterMap(url, name=page.name)
            middleware.append(sitemap)
            processed.add(page.name)
        # Last add the CMS router
        if processed:
            middleware.append(CMSRouter('<path:path>'))

    def inner_html(self, request, page, inner_html):
        try:
            if not page.name:
                raise Http404
            path = page.urlargs.get('path', 'index')
            path = api_path(request, 'contents', page.name, path)
            data = request.api.get(path).json()
            inner_html = self.data_to_html(page, data, inner_html)
        except Http404:
            if request.cache.cms_router:
                raise
        return super().inner_html(request, page, inner_html)

    def context(self, request, context):
        ctx = {}
        app = request.app
        for entry in self.context_data(request):
            lazy = LazyContext(app, entry, context)
            ctx[lazy.key] = lazy
        return ctx

    @cached(key='cms:context')
    def context_data(self, request):
        return request.api.get('contents/context').json()['result']

    def html_content(self, request, path, context):
        page = self.as_page()
        path = api_path(request, 'contents', path)
        data = request.api.get(path).json()
        html = self.data_to_html(page, data)
        context = self.app.context(request, context)
        return html.render(self.app, context)

    def data_to_html(self, page, data, inner_html=None):
        template = Template(data.pop('body', None))
        inner_html = self.app.cms.replace_html_main(template, inner_html)
        replace(page, data, 'inner_template')
        replace(page, data, 'body_template')
        reader = get_reader(self.app, ext=data.pop('type', 'html'))
        page.meta = page.meta or {}
        page.meta.update(data)
        return Template(reader.process(inner_html).body)

    def all(self, request, name):
        path = api_path(request, 'contents', name)
        return request.api.get(path).json()['result']


class LazyContext:

    def __init__(self, app, entry, context):
        self.app = app
        self.key = 'html_%s' % entry['slug']
        self.entry = entry
        self.context = context

    def __str__(self):
        if not isinstance(self.context, str):
            context = self.context
            entry = self.entry
            engine = self.app.template_engine(entry.get('template_engine'))
            body = engine(entry['body'], self.context)
            template = entry.get('template')
            if template:
                context['html_main'] = body
                body = self.app.cms.render(template, context)
            self.context = body
            context[self.key] = body
        return self.context


def replace(page, data, key):
    if key in data:
        page[key] = data.pop(key)
