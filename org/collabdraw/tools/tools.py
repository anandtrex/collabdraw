import logging
import config
import hashlib
import os
import glob

import cairo


def createCairoContext(w, h):
    surface = cairo.ImageSurface(cairo.FORMAT_RGB24, w, h)
    ctx = cairo.Context(surface)
    ctx.set_source_rgb(255, 255, 255)
    ctx.rectangle(0, 0, w, h)
    ctx.fill()
    return ctx


def hexColorToRGB(colorstring):
    logger = logging.getLogger('websocket')
    """ convert #RRGGBB to an (R, G, B) tuple """
    colorstring = colorstring.strip()
    if colorstring == "black":
        return (0, 0, 0)
    elif colorstring == "blue":
        return (0, 0, 255)
    elif colorstring == "green":
        return (0, 255, 0)
    elif colorstring == "red":
        return (255, 0, 0)
    logger.debug("Converting string %s to rgb" % colorstring)
    if colorstring[0] == '#': colorstring = colorstring[1:]
    if len(colorstring) != 6:
        logger.error("input #%s is not in #RRGGBB format" % colorstring)
        return (0, 0, 0)
    r, g, b = colorstring[:2], colorstring[2:4], colorstring[4:]
    r, g, b = [int(n, 16) for n in (r, g, b)]
    logger.debug("Returning %d, %d, %d" % (r, g, b))
    return (r, g, b)


def hash_password(password):
    s = config.HASH_SALT + password
    return hashlib.md5(s.encode("utf-8")).hexdigest()

def delete_files(pattern):
    """
    Works only for files, not directories
    """
    filelist = glob.glob(pattern)
    for f in filelist:
        os.remove(f)
