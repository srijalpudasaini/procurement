<?php

namespace App\Interfaces;

interface CategoryInterface
{
    public function all($per_page);

    public function list();
    public function find($id);
    public function store(array $data);
    public function update($id, array $data);
    public function delete($id);
}
