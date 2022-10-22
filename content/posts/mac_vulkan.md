+++
title = "macOSのVulkanで\"vk::createInstanceUnique: ErrorIncompatibleDriver\"というエラーが出る (Vulkan SDK 1.3.216.0以降)"
date = 2022-10-22
[taxonomies]
categories = ["posts"]
tags = ["macOS", "Vulkan"]
+++

macのVulkan (というかMoltenVK) で`vk::createInstanceUnique`を実行時に`ErrorIncompatibleDriver`というエラーが出るようになった. (`vulkan.hpp`を使用)

そういえば, 古いバージョンのSDKでは普通に動いていたはずなので[リリースノート](https://vulkan.lunarg.com/doc/sdk/1.3.216.0/mac/release_notes.html)をあさると, それらしきことが書いてあった.

> This release of the Vulkan Loader for macOS will require the addition of the VK_KHR_portability_enumaration extension. This is easily added, and without it, you will not see a valid driver when using MoltenVK. Details and example code can be found in the macOS Getting Started Guide.

というわけで, [macOS Getting Started Guide](https://vulkan.lunarg.com/doc/sdk/1.3.224.1/mac/getting_started.html)に従って, 

- `vk::DeviceCreateInfo`で指定するDevice extensionsに`VK_KHR_portability_subset`を追加
- `vk::InstanceCreateInfo`で指定するInstance extensionsに`VK_KHR_portability_enumeration`を追加
- `vk::InstanceCreateInfo`で指定するInstance flagに`vk::InstanceCreateFlagBits::eEnumeratePortabilityKHR`を追加

以上三点で治った.

ちなみに, Validation layersを有効にすると, 一番上エラーに関しては警告を出してくれたが, 下二つに関してはとくに何も表示されなかった.
