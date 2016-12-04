# hapi-hemera

- __Status:__ In Development

**hapi-hemera** is a [**Hemera**](https://github.com/hemerajs/hemera) micro-services plugin
for [hapi](https://github.com/hapijs/hapi). The plugin integrates the **Hemera** functionality into
**hapi** and provide tools to map its actions to server methods and views for easy access.

### Usage

#### Plugin Registration

**hapi-hemera** is registered with a **hapi** server using the `server.register()` method. Once
registered it decorates the `server` object with a reference to the `hemera` object initialized
using the provided plugin options. Default plugin options:

TBD;
