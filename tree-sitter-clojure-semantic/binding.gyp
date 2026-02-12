{
  "targets": [
    {
      "target_name": "tree_sitter_clojure_semantic_binding",
      "dependencies": [
        "<!(node -p \"require('node-addon-api').targets\"):node_addon_api_except",
      ],
      "include_dirs": [
        "src",
      ],
      "sources": [
        "bindings/node/binding.cc",
        "src/parser.c",
        # NOTE: if your language has an external scanner, add it here.
      ],
      "conditions": [
        ["OS!='win'", {
          "cflags_c": [
            "-std=c11",
            "-O3",
            "-march=native",
            "-flto",
            "-ffast-math",
            "-funroll-loops",
          ],
          "cflags_cc": [
            "-O3",
            "-march=native",
            "-flto",
          ],
          "ldflags": [
            "-flto",
          ],
        }, { # OS == "win"
          "cflags_c": [
            "/std:c11",
            "/utf-8",
            "/O2",
            "/GL",
          ],
        }],
      ],
    }
  ]
}
