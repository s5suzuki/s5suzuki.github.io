+++
title = "enum classをビットフラグの様に使う"
date = 2023-04-07
[taxonomies]
categories = ["posts"]
tags = ["C++", "C++17"]
[extra]
toc = true
+++

備忘録

```cpp
#include <type_traits>

template <typename E>
struct is_scoped_enum : std::integral_constant<bool, std::is_enum_v<E> && !std::is_convertible_v<E, int>> {};

template <typename E>
inline constexpr bool is_scoped_enum_v = is_scoped_enum<E>::value;

template <typename T, std::enable_if_t<is_scoped_enum_v<T>, std::nullptr_t> = nullptr>
class BitFlags {
 public:
  typedef std::underlying_type_t<T> value_type;

  constexpr BitFlags() : _value() {}
  constexpr BitFlags(T value) : _value(static_cast<value_type>(value)) {}  // NOLINT
  constexpr BitFlags(const BitFlags& value) = default;
  constexpr BitFlags& operator=(const BitFlags& obj) = default;
  constexpr BitFlags(BitFlags&& obj) = default;
  constexpr BitFlags& operator=(BitFlags&& obj) = default;
  ~BitFlags() = default;

  constexpr bool operator==(const BitFlags a) const { return _value == a._value; }
  constexpr bool operator!=(const BitFlags a) const { return _value != a._value; }
  constexpr bool operator==(const T a) const { return _value == static_cast<value_type>(a); }
  constexpr bool operator!=(const T a) const { return _value != static_cast<value_type>(a); }

  [[nodiscard]] constexpr value_type value() const noexcept { return _value; }

  [[nodiscard]] constexpr bool contains(const T value) const noexcept {
    auto v = static_cast<value_type>(value);
    return (_value & v) == v;
  }

  void set(const T v) noexcept { _value = static_cast<value_type>(_value | static_cast<value_type>(v)); }

  void remove(const T v) noexcept { _value = static_cast<value_type>(_value & ~static_cast<value_type>(v)); }

  constexpr BitFlags& operator|=(BitFlags value) {
    _value |= static_cast<value_type>(value._value);
    return *this;
  }

 private:
  value_type _value;
};

template <typename T>
constexpr BitFlags<T> operator|(BitFlags<T> lhs, BitFlags<T> rhs) {
  return static_cast<T>(lhs.value() | rhs.value());
}

template <typename T>
constexpr BitFlags<T> operator|(T lhs, T rhs) {
  using value_type = typename BitFlags<T>::value_type;
  return static_cast<T>(static_cast<value_type>(lhs) | static_cast<value_type>(rhs));
}

#include <bitset>
#include <iostream>

enum class Foo : int8_t { None = 0, A = 1 << 0, B = 1 << 1 };

void print_flag(const BitFlags<Foo> param) { std::cout << std::bitset<8>(param.value()) << std::endl; }

int main() {
  constexpr BitFlags a = Foo::A;
  constexpr BitFlags b = Foo::B;

  static_assert(a.contains(Foo::A));
  static_assert(!a.contains(Foo::B));

  print_flag(a);      // 00000001
  print_flag(b);      // 00000010
  print_flag(a | b);  // 00000011

  print_flag(Foo::A | Foo::B);  // 00000011

  BitFlags c = Foo::None;
  print_flag(c);  // 00000000
  c.set(Foo::A);
  print_flag(c);  // 00000001
  c.set(Foo::B);
  c.remove(Foo::A);
  print_flag(c);  // 00000010

  return 0;
}
```

# 参考文献

- [C++のscoped enumで関数のフラグ指定をしたい](https://qiita.com/prickle/items/c4de8cc23556c6a3d93b)
- [C++11 type trait to differentiate between enum class and regular enum](https://stackoverflow.com/questions/15586163/c11-type-trait-to-differentiate-between-enum-class-and-regular-enum)
