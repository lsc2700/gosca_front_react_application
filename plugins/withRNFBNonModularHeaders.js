const { withPodfile } = require('expo/config-plugins');
const { mergeContents } = require('@expo/config-plugins/build/utils/generateCode');

/**
 * @react-native-firebase + iOS static frameworks (use_frameworks):
 * RNFB pods import React-Core headers that are not modular; Clang treats
 * -Wnon-modular-include-in-framework-module as an error. Allow those includes per RNFB target.
 */
const RUBY_SNIPPET = [
  '    installer.pods_project.targets.each do |target|',
  "      if target.name.start_with?('RNFB')",
  '        target.build_configurations.each do |bc|',
  "          bc.build_settings['CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES'] = 'YES'",
  '        end',
  '      end',
  '    end',
].join('\n');

function withRNFBNonModularHeaders(config) {
  return withPodfile(config, (config) => {
    const { contents, didMerge } = mergeContents({
      tag: 'rnfb-non-modular-includes',
      src: config.modResults.contents,
      newSrc: RUBY_SNIPPET,
      anchor: /post_install do \|installer\|/,
      offset: 1,
      comment: '#',
    });
    if (didMerge) {
      config.modResults.contents = contents;
    }
    return config;
  });
}

module.exports = withRNFBNonModularHeaders;
