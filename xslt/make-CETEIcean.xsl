<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:t="http://www.tei-c.org/ns/1.0"
  xmlns:eg="http://www.tei-c.org/ns/Examples"
  exclude-result-prefixes="t eg"
  version="1.0">
  <xsl:output method="html" indent="no"/>
  
  <xsl:param name="CSS">http://teic.github.io/CETEIcean/css/CETEIcean.css</xsl:param>
  <xsl:param name="CETEI">https://github.com/TEIC/CETEIcean/releases/download/v0.4.0/CETEI.js</xsl:param>
  
  <xsl:template match="/">
    <xsl:text disable-output-escaping="yes">&lt;!DOCTYPE html&gt;</xsl:text>
    <html>
      <head>
        <link rel="stylesheet" href="{$CSS}"/>
        <script type="text/javascript" src="{$CETEI}"></script>
        <script type="text/javascript">
          var c = new CETEI();
          c.els = [<xsl:call-template name="elements"/>];
          c.els.push("egXML");
          if (document.registerElement) {
            c.registerAll(c.els);
          } else {
            c.fallback(c.els);
          }
        </script>
        <xsl:if test="//t:rendition[@scheme='css']">
          <style>
            <xsl:apply-templates select="//t:rendition[@scheme='css']" mode="style"/>
          </style>
        </xsl:if>
      </head>
      <body><xsl:text>
</xsl:text>
        <xsl:apply-templates select="node()|comment()|processing-instruction()"/><xsl:text>
</xsl:text>
      </body>
    </html>
  </xsl:template>
  
  <xsl:template match="node()|@*|comment()|processing-instruction()">
    <xsl:copy><xsl:apply-templates select="node()|@*|comment()|processing-instruction()"/></xsl:copy>
  </xsl:template>
  
  <xsl:template match="*[namespace-uri(.) = 'http://www.tei-c.org/ns/1.0']">
    <xsl:element name="tei-{translate(local-name(.), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz')}" >
      <xsl:if test="namespace-uri(parent::*) != namespace-uri(.)"><xsl:attribute name="data-xmlns"><xsl:value-of select="namespace-uri(.)"/></xsl:attribute></xsl:if>
      <xsl:if test="@xml:id">
        <xsl:attribute name="id"><xsl:value-of select="@xml:id"/></xsl:attribute>
      </xsl:if>
      <xsl:if test="@xml:lang">
        <xsl:attribute name="lang"><xsl:value-of select="@xml:lang"/></xsl:attribute>
      </xsl:if>
      <xsl:if test="rendition">
        <xsl:attribute name="class"><xsl:value-of select="substring-after(@rendition, '#')"/></xsl:attribute>
      </xsl:if>
      <xsl:attribute name="data-teiname"><xsl:value-of select="local-name(.)"/></xsl:attribute>
      <xsl:for-each select="@*">
        <xsl:copy-of select="."/>
      </xsl:for-each>
      <xsl:apply-templates select="node()|comment()|processing-instruction()"/>
    </xsl:element>
  </xsl:template>
  
  <xsl:template match="eg:egXML">
    <teieg-egxml>
      <xsl:if test="namespace-uri(parent::*) != namespace-uri(.)"><xsl:attribute name="data-xmlns"><xsl:value-of select="namespace-uri(.)"/></xsl:attribute></xsl:if>
      <xsl:if test="@xml:id">
        <xsl:attribute name="id"><xsl:value-of select="@xml:id"/></xsl:attribute>
      </xsl:if>
      <xsl:if test="@xml:lang">
        <xsl:attribute name="lang"><xsl:value-of select="@xml:lang"/></xsl:attribute>
      </xsl:if>
      <xsl:if test="rendition">
        <xsl:attribute name="class"><xsl:value-of select="substring-after(@rendition, '#')"/></xsl:attribute>
      </xsl:if>
      <xsl:attribute name="data-teiname"><xsl:value-of select="local-name(.)"/></xsl:attribute>
      <xsl:for-each select="@*">
        <xsl:copy-of select="."/>
      </xsl:for-each>
      <xsl:apply-templates select="node()|comment()|processing-instruction()"/>
    </teieg-egxml>
  </xsl:template>
  
  <xsl:template match="*[namespace-uri(.) = 'http://www.tei-c.org/ns/Examples']">
    <xsl:element name="teieg-{translate(local-name(.), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz')}" >
      <xsl:if test="namespace-uri(parent::*) != namespace-uri(.)"><xsl:attribute name="data-xmlns"><xsl:value-of select="namespace-uri(.)"/></xsl:attribute></xsl:if>
      <xsl:if test="@xml:id">
        <xsl:attribute name="id"><xsl:value-of select="@xml:id"/></xsl:attribute>
      </xsl:if>
      <xsl:if test="@xml:lang">
        <xsl:attribute name="lang"><xsl:value-of select="@xml:lang"/></xsl:attribute>
      </xsl:if>
      <xsl:if test="rendition">
        <xsl:attribute name="class"><xsl:value-of select="substring-after(@rendition, '#')"/></xsl:attribute>
      </xsl:if>
      <xsl:attribute name="data-teiname"><xsl:value-of select="local-name(.)"/></xsl:attribute>
      <xsl:for-each select="@*">
        <xsl:copy-of select="."/>
      </xsl:for-each>
      <xsl:apply-templates select="node()|comment()|processing-instruction()"/>
    </xsl:element>
  </xsl:template>
  
  <xsl:template name="elements">
    <xsl:for-each select="//*[namespace-uri(.) = 'http://www.tei-c.org/ns/1.0']">
      <xsl:if test="not(preceding::*[local-name() = local-name(current())])">"<xsl:value-of select="local-name()"/>"<xsl:if test="position() != last()">,</xsl:if></xsl:if></xsl:for-each>    
  </xsl:template>
  
  <!-- Handle CSS Styles -->
  
  <xsl:template mode="style" match="t:rendition">
    <xsl:choose>
      <xsl:when test="@xml:id" xml:space="preserve">
#<xsl:value-of select="@xml:id"/> {
  <xsl:value-of select="."/>       
}
      </xsl:when>
      <xsl:when test="@selector">
<xsl:call-template name="rewrite-selectors"><xsl:with-param name="in" select="@selector"/></xsl:call-template> {
  <xsl:value-of select="."/>       
}
      </xsl:when>
    </xsl:choose>
  </xsl:template>
  
  <!-- 
    turn 'p > a' into 'p>a', 'div, p', into 'div,p', etc. 
  -->
  <xsl:template name="normalize-selectors">
    <xsl:param name="in"/>
    <xsl:call-template name="normalize-child-selector">
      <xsl:with-param name="selector"><xsl:call-template name="normalize-list-selector"><xsl:with-param name="selector" select="$in"/></xsl:call-template></xsl:with-param>
    </xsl:call-template>    
  </xsl:template>
  
  <xsl:template name="normalize-child-selector">
    <xsl:param name="selector"/>
    <xsl:choose>
      <xsl:when test="contains($selector, ' > ')">
        <xsl:call-template name="normalize-child-selector">
          <xsl:with-param name="selector"><xsl:value-of select="substring-before($selector,' > ')"/>><xsl:value-of select="substring-after($selector,' > ')"/></xsl:with-param>
        </xsl:call-template>
      </xsl:when>
      <xsl:when test="contains($selector, ' >')">
        <xsl:call-template name="normalize-child-selector">
          <xsl:with-param name="selector"><xsl:value-of select="substring-before($selector,' >')"/>><xsl:value-of select="substring-after($selector,' >')"/></xsl:with-param>
        </xsl:call-template>
      </xsl:when>
      <xsl:when test="contains($selector, '> ')">
        <xsl:call-template name="normalize-child-selector">
          <xsl:with-param name="selector"><xsl:value-of select="substring-before($selector,'> ')"/>><xsl:value-of select="substring-after($selector,'> ')"/></xsl:with-param>
        </xsl:call-template>
      </xsl:when>
      <xsl:otherwise>
        <xsl:value-of select="$selector"/>
      </xsl:otherwise>
    </xsl:choose>
  </xsl:template>
  
  <xsl:template name="normalize-list-selector">
    <xsl:param name="selector"/>
    <xsl:choose>
      <xsl:when test="contains($selector, ', ')">
        <xsl:call-template name="normalize-child-selector">
          <xsl:with-param name="selector"><xsl:value-of select="substring-before($selector,', ')"/>,<xsl:value-of select="substring-after($selector,', ')"/></xsl:with-param>
        </xsl:call-template>
      </xsl:when>
      <xsl:otherwise>
        <xsl:value-of select="$selector"/>
      </xsl:otherwise>
    </xsl:choose>
  </xsl:template>
  
  <!-- div>div p -> tei-div>tei-div p-->
  <xsl:template name="rewrite-child-selector">
    <xsl:param name="selector"/>
    <xsl:param name="result"/>
    <xsl:choose>
      <xsl:when test="contains($selector, '>')">
        <xsl:call-template name="normalize-child-selector">
          <xsl:with-param name="result">>tei-<xsl:value-of select="substring-after($selector,'>')"/></xsl:with-param>
          <xsl:with-param name="selector"><xsl:value-of select="substring-after($selector, '>')"/></xsl:with-param>
        </xsl:call-template>
      </xsl:when>
      <xsl:otherwise>
<xsl:if test="not(starts-with($result,'tei-') or starts-with($selector, 'tei-'))">tei-</xsl:if><xsl:value-of select="$result"/><xsl:value-of select="$selector"/>
      </xsl:otherwise>
    </xsl:choose>
  </xsl:template>
  
  <!-- div>div p -> tei-div>div tei-p-->
  <xsl:template name="rewrite-descendent-selector">
    <xsl:param name="selector"/>
    <xsl:param name="result"/>
    <xsl:choose>
      <xsl:when test="contains($selector, ' ')">
        <xsl:call-template name="normalize-child-selector">
          <xsl:with-param name="result"> tei-<xsl:value-of select="substring-after($selector,' ')"/></xsl:with-param>
          <xsl:with-param name="selector"><xsl:value-of select="substring-after($selector, ' ')"/></xsl:with-param>
        </xsl:call-template>
      </xsl:when>
      <xsl:otherwise>
<xsl:if test="not(starts-with($result,'tei-') or starts-with($selector, 'tei-'))">tei-</xsl:if><xsl:value-of select="$result"/><xsl:value-of select="$selector"/>
      </xsl:otherwise>
    </xsl:choose>
  </xsl:template>
  
  <!-- div,p -> tei-div,tei-p-->
  <xsl:template name="rewrite-list-selector">
    <xsl:param name="selector"/>
    <xsl:param name="result"/>
    <xsl:choose>
      <xsl:when test="contains($selector, ',')">
        <xsl:call-template name="normalize-child-selector">
          <xsl:with-param name="result">,tei-<xsl:value-of select="substring-after($selector,',')"/></xsl:with-param>
          <xsl:with-param name="selector"><xsl:value-of select="substring-after($selector, ',')"/></xsl:with-param>
        </xsl:call-template>
      </xsl:when>
      <xsl:otherwise>
<xsl:if test="not(starts-with($result,'tei-') or starts-with($selector, 'tei-'))">tei-</xsl:if><xsl:value-of select="$result"/><xsl:value-of select="$selector"/>
      </xsl:otherwise>
    </xsl:choose>
  </xsl:template>
  
  <xsl:template name="rewrite-selectors">
    <xsl:param name="in"/>
    <xsl:variable name="reg"><xsl:call-template name="normalize-selectors"><xsl:with-param name="in" select="$in"/></xsl:call-template></xsl:variable>
<xsl:call-template name="normalize-list-selector"><xsl:with-param name="selector"><xsl:call-template name="rewrite-descendent-selector"><xsl:with-param name="selector"><xsl:call-template name="rewrite-child-selector"><xsl:with-param name="selector" select="$reg"></xsl:with-param></xsl:call-template></xsl:with-param></xsl:call-template></xsl:with-param></xsl:call-template>
  </xsl:template>
  
</xsl:stylesheet>