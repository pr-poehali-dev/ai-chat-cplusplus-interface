export type Mode = 'chat' | 'generate' | 'explain' | 'debug' | 'examples';
export type CppVersion = 'C++11' | 'C++14' | 'C++17' | 'C++20' | 'C++23';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  code?: string;
  timestamp: Date;
  mode: Mode;
}

export interface Chat {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  mode: Mode;
}

// Примерные ответы C++ ассистента
const RESPONSES: Record<Mode, (input: string, version: CppVersion) => { text: string; code?: string }> = {
  chat: (input, version) => {
    const lower = input.toLowerCase();
    if (lower.includes('вектор') || lower.includes('vector')) {
      return {
        text: `**std::vector** — динамический массив из стандартной библиотеки ${version}. Хранит элементы непрерывно в памяти, обеспечивая O(1) доступ по индексу и амортизированный O(1) push_back.`,
        code: `#include <iostream>\n#include <vector>\n#include <algorithm>\n\nint main() {\n    std::vector<int> nums = {5, 3, 1, 4, 2};\n\n    // Добавляем элемент\n    nums.push_back(6);\n\n    // Сортировка\n    std::sort(nums.begin(), nums.end());\n\n    // Вывод с range-based for (${version})\n    for (const auto& n : nums) {\n        std::cout << n << " ";\n    }\n\n    return 0;\n}`
      };
    }
    if (lower.includes('указатель') || lower.includes('pointer') || lower.includes('smart')) {
      return {
        text: `Умные указатели в ${version} — основной инструмент управления памятью без утечек. Вместо сырых указателей используй **unique_ptr** (единственный владелец) или **shared_ptr** (разделённое владение).`,
        code: `#include <iostream>\n#include <memory>\n\nclass Resource {\npublic:\n    Resource(int val) : value(val) {\n        std::cout << "Создан: " << value << "\\n";\n    }\n    ~Resource() {\n        std::cout << "Удалён: " << value << "\\n";\n    }\n    int value;\n};\n\nint main() {\n    // unique_ptr — единственный владелец\n    auto uptr = std::make_unique<Resource>(42);\n    std::cout << "Value: " << uptr->value << "\\n";\n\n    // shared_ptr — разделённое владение\n    auto sptr1 = std::make_shared<Resource>(100);\n    auto sptr2 = sptr1; // счётчик = 2\n    std::cout << "Refs: " << sptr1.use_count() << "\\n";\n\n    return 0; // всё удалится автоматически\n}`
      };
    }
    if (lower.includes('лямбда') || lower.includes('lambda')) {
      return {
        text: `Лямбда-выражения введены в ${version === 'C++11' ? 'C++11' : version} — анонимные функции с захватом переменных из внешнего контекста. Незаменимы при работе с алгоритмами STL.`,
        code: `#include <iostream>\n#include <vector>\n#include <algorithm>\n\nint main() {\n    std::vector<int> data = {1, 2, 3, 4, 5, 6};\n    int threshold = 3;\n\n    // Захват по значению [=]\n    auto evens = std::count_if(data.begin(), data.end(),\n        [threshold](int x) { return x > threshold; });\n\n    std::cout << "Больше " << threshold << ": " << evens << "\\n";\n\n    // Трансформация с лямбдой\n    std::transform(data.begin(), data.end(), data.begin(),\n        [](int x) { return x * x; });\n\n    for (auto x : data)\n        std::cout << x << " ";\n\n    return 0;\n}`
      };
    }
    return {
      text: `Отличный вопрос по ${version}! Можешь уточнить, что именно тебя интересует? Я специализируюсь на:\n\n• **Генерации кода** — напишу готовое решение\n• **Объяснении** — разберу любую концепцию\n• **Отладке** — найду ошибки в коде\n• **Паттернах** — покажу лучшие практики`,
    };
  },
  generate: (input, version) => {
    const lower = input.toLowerCase();
    if (lower.includes('сортировк') || lower.includes('sort')) {
      return {
        text: `Реализация алгоритма быстрой сортировки (QuickSort) на ${version} с поддержкой шаблонов и компаратора:`,
        code: `#include <iostream>\n#include <vector>\n#include <functional>\n\ntemplate <typename T, typename Comp = std::less<T>>\nvoid quickSort(std::vector<T>& arr, int left, int right, Comp comp = {}) {\n    if (left >= right) return;\n\n    T pivot = arr[(left + right) / 2];\n    int i = left, j = right;\n\n    while (i <= j) {\n        while (comp(arr[i], pivot)) i++;\n        while (comp(pivot, arr[j])) j--;\n        if (i <= j) {\n            std::swap(arr[i], arr[j]);\n            i++; j--;\n        }\n    }\n\n    quickSort(arr, left, j, comp);\n    quickSort(arr, i, right, comp);\n}\n\nint main() {\n    std::vector<int> data = {64, 34, 25, 12, 22, 11, 90};\n\n    quickSort(data, 0, (int)data.size() - 1);\n\n    for (const auto& x : data)\n        std::cout << x << " ";\n    std::cout << "\\n";\n\n    return 0;\n}`
      };
    }
    if (lower.includes('стек') || lower.includes('stack')) {
      return {
        text: `Реализация стека на шаблонах (${version}):`,
        code: `#include <iostream>\n#include <vector>\n#include <stdexcept>\n\ntemplate <typename T>\nclass Stack {\nprivate:\n    std::vector<T> data_;\n\npublic:\n    void push(T value) {\n        data_.push_back(std::move(value));\n    }\n\n    void pop() {\n        if (empty()) throw std::underflow_error("Stack is empty");\n        data_.pop_back();\n    }\n\n    T& top() {\n        if (empty()) throw std::underflow_error("Stack is empty");\n        return data_.back();\n    }\n\n    [[nodiscard]] bool empty() const noexcept {\n        return data_.empty();\n    }\n\n    [[nodiscard]] size_t size() const noexcept {\n        return data_.size();\n    }\n};\n\nint main() {\n    Stack<int> s;\n    s.push(1);\n    s.push(2);\n    s.push(3);\n\n    while (!s.empty()) {\n        std::cout << s.top() << "\\n";\n        s.pop();\n    }\n\n    return 0;\n}`
      };
    }
    return {
      text: `Вот готовый шаблон класса на ${version} с конструкторами, деструктором и операторами:`,
      code: `#include <iostream>\n#include <string>\n#include <utility>\n\nclass MyClass {\nprivate:\n    std::string name_;\n    int value_;\n\npublic:\n    // Конструктор\n    explicit MyClass(std::string name, int value = 0)\n        : name_(std::move(name)), value_(value) {}\n\n    // Деструктор\n    ~MyClass() = default;\n\n    // Конструктор копирования\n    MyClass(const MyClass&) = default;\n\n    // Конструктор перемещения\n    MyClass(MyClass&&) noexcept = default;\n\n    // Оператор присваивания\n    MyClass& operator=(const MyClass&) = default;\n    MyClass& operator=(MyClass&&) noexcept = default;\n\n    // Геттеры\n    [[nodiscard]] const std::string& name() const noexcept { return name_; }\n    [[nodiscard]] int value() const noexcept { return value_; }\n\n    // Оператор вывода\n    friend std::ostream& operator<<(std::ostream& os, const MyClass& obj) {\n        return os << "MyClass{" << obj.name_ << ", " << obj.value_ << "}";\n    }\n};\n\nint main() {\n    MyClass obj("test", 42);\n    std::cout << obj << "\\n";\n    return 0;\n}`
    };
  },
  explain: (_input, version) => {
    return {
      text: `Разбираю код построчно для **${version}**:`,
      code: `// Пример: RAII паттерн в C++\n// RAII = Resource Acquisition Is Initialization\n\nclass FileGuard {\n    FILE* file_;            // Ресурс — файловый дескриптор\n\npublic:\n    // Конструктор: захватываем ресурс\n    explicit FileGuard(const char* path) {\n        file_ = fopen(path, "r");\n    }\n\n    // Деструктор: освобождаем ресурс автоматически\n    // Вызывается при выходе из области видимости\n    ~FileGuard() {\n        if (file_) fclose(file_);\n    }\n\n    // Запрещаем копирование (unique ownership)\n    FileGuard(const FileGuard&) = delete;\n    FileGuard& operator=(const FileGuard&) = delete;\n\n    bool isOpen() const { return file_ != nullptr; }\n};`
    };
  },
  debug: (_input, version) => {
    return {
      text: `Нашёл типичные ошибки C++. Вот исправленная версия с комментариями для **${version}**:`,
      code: `// ❌ НЕПРАВИЛЬНО:\n// int* ptr = new int(42);\n// // ... используем ptr ...\n// // Забыли delete ptr; → УТЕЧКА ПАМЯТИ\n\n// ✅ ПРАВИЛЬНО: используем unique_ptr\n#include <memory>\n#include <iostream>\n\nvoid badExample() {\n    // ❌ Доступ к нулевому указателю\n    // int* p = nullptr;\n    // *p = 5; // SEGFAULT!\n\n    // ✅ Проверяем перед использованием\n    int* p = nullptr;\n    if (p != nullptr) {\n        *p = 5;\n    }\n}\n\nvoid goodMemory() {\n    // ✅ unique_ptr — автоматическое управление памятью\n    auto ptr = std::make_unique<int>(42);\n    std::cout << *ptr << "\\n";\n    // delete вызовется автоматически\n}\n\nint main() {\n    goodMemory();\n    return 0;\n}`
    };
  },
  examples: (_input, version) => {
    return {
      text: `Паттерн **Singleton** — классический пример из ${version} с потокобезопасной инициализацией:`,
      code: `#include <iostream>\n#include <mutex>\n#include <memory>\n\n// Потокобезопасный Singleton (${version})\nclass Database {\nprivate:\n    static std::unique_ptr<Database> instance_;\n    static std::once_flag flag_;\n    std::string connectionStr_;\n\n    explicit Database(std::string conn)\n        : connectionStr_(std::move(conn)) {\n        std::cout << "DB подключена\\n";\n    }\n\npublic:\n    // Запрещаем копирование\n    Database(const Database&) = delete;\n    Database& operator=(const Database&) = delete;\n\n    // Единственная точка доступа\n    static Database& getInstance() {\n        std::call_once(flag_, []() {\n            instance_ = std::make_unique<Database>("localhost:5432");\n        });\n        return *instance_;\n    }\n\n    void query(const std::string& sql) const {\n        std::cout << "Query: " << sql << "\\n";\n    }\n};\n\nstd::unique_ptr<Database> Database::instance_ = nullptr;\nstd::once_flag Database::flag_;\n\nint main() {\n    Database::getInstance().query("SELECT * FROM users");\n    Database::getInstance().query("SELECT * FROM orders");\n    return 0;\n}`
    };
  }
};

export function getAIResponse(input: string, mode: Mode, version: CppVersion): { text: string; code?: string } {
  return RESPONSES[mode](input, version);
}

export const MODE_CONFIG: Record<Mode, { label: string; icon: string; color: string; placeholder: string }> = {
  chat:     { label: 'Чат',       icon: 'MessageSquare', color: '#58a6ff', placeholder: 'Задайте вопрос по C++...' },
  generate: { label: 'Генерация', icon: 'Wand2',         color: '#bc8cff', placeholder: 'Опишите, что нужно написать...' },
  explain:  { label: 'Объяснение',icon: 'BookOpen',      color: '#ffa657', placeholder: 'Вставьте код для объяснения...' },
  debug:    { label: 'Отладка',   icon: 'Bug',           color: '#f85149', placeholder: 'Вставьте код с ошибками...' },
  examples: { label: 'Примеры',   icon: 'Layers',        color: '#3fb950', placeholder: 'Назовите паттерн или тему...' },
};

export const CPP_VERSIONS: CppVersion[] = ['C++11', 'C++14', 'C++17', 'C++20', 'C++23'];
