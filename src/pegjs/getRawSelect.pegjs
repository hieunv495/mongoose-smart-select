// MKRES select object field parser

fields_select
	= head:field tail:(value_separator field:field { return field})* 
    	{
   		let fields = [head].concat(tail)
          if(fields.find(function(f){return f.spread}))
          	return {
            	all: true,
            	fields: fields.filter(function(f){return !f.spread})
            }
            
          return {
          	all: false,
          	fields: fields
          }
    	}
    
begin_array     = ws "[" ws
begin_object    = ws "{" ws
end_array       = ws "]" ws
end_object      = ws "}" ws
begin_round		= ws "(" ws
end_round		= ws ")" ws
name_separator  = ws ":" ws
value_separator = ws "," ws
spread 			= ws "..." ws

ws "whitespace" = [ \t\n\r]*

field
	= removed_field
    / default_field
    
fields_wrapper 
	= begin_object fields_select:fields_select end_object { return fields_select}
    / begin_object end_object { return { all: true,fields: []}}

removed_field = minus name:field_name { return {type: "remove", name:name}}

default_field 
	= name:field_name fields_select:fields_wrapper range:range 
    	{ return {name:name,select: fields_select, range:range } }
    / name:field_name range:range fields_select:fields_wrapper 
    	{ return {name:name, select: fields_select, range:range} }
    / name:field_name fields_select:fields_wrapper 
    	{ return {name:name, select: fields_select} } 
    / name:field_name range:range { return {name: name, range: range}}
    / name:field_name {return {name: name}}
    / spread {return {spread: true}}

field_name 
	= [_a-zA-Z0-9]+ {return text()}

range
	= begin_array from:index_number name_separator to:index_number end_array {return {from: from, to: to}}
	/ begin_array from:index_number name_separator end_array { return {from: from, to: null}} 
    / begin_array name_separator to:index_number end_array { return {from: null, to: to}}
	/ begin_array name_separator end_array { return {from:null, to: null}}
    / begin_array end_array { return {from:null, to: null}}

paging
	= begin_array limit:int end_array begin_round page:int end_round { return {limit:limit,page:page} }
    / begin_array limit:int end_array begin_round end_round { return {limit:limit,page:1} }
	/ begin_array limit:int end_array { return {limit:limit,page:1} }
    / begin_array end_array begin_round page:int end_round { return {page:page} }
    / begin_array end_array begin_round end_round { return {page:1} }
    / begin_array end_array { return {page: 1} }


index_number
	= minus? int { return parseInt(text())}

// ----- 6. Numbers -----

number "number"
  = minus? int frac? exp? { return parseFloat(text()); }

decimal_point
  = "."

digit1_9
  = [1-9]

e
  = [eE]

exp
  = e (minus / plus)? DIGIT+

frac
  = decimal_point DIGIT+

int
  = zero {return 0} / (digit1_9 DIGIT*) { return parseInt(text()) }

minus
  = "-"

plus
  = "+"

zero
  = "0"
  
// ----- 7. Strings -----

string "string"
  = quotation_mark chars:char* quotation_mark { return chars.join(""); }

char
  = unescaped
  / escape
    sequence:(
        '"'
      / "\\"
      / "/"
      / "b" { return "\b"; }
      / "f" { return "\f"; }
      / "n" { return "\n"; }
      / "r" { return "\r"; }
      / "t" { return "\t"; }
      / "u" digits:$(HEXDIG HEXDIG HEXDIG HEXDIG) {
          return String.fromCharCode(parseInt(digits, 16));
        }
    )
    { return sequence; }

escape
  = "\\"

quotation_mark
  = '"'

unescaped
  = [^\0-\x1F\x22\x5C]
  
 // See RFC 4234, Appendix B (http://tools.ietf.org/html/rfc4234).
DIGIT  = [0-9]
HEXDIG = [0-9a-f]i